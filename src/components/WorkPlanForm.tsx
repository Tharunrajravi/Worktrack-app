import {
  useRef,
  useState,
} from 'react';

import { useModalAccessibility } from './useModalAccessibility';

import { v4 as uuid } from 'uuid';

import type {
  WorkCategory,
  WorkItem,
  WorkLink,
  WorkPriority,
} from '../types/work';

import {
  WORK_CATEGORIES,
  WORK_PRIORITIES,
} from '../types/work';


interface Props {
  date: string;

  onCancel: () => void;

  onCreate: (
    item: WorkItem,
  ) => void;

  submitting?: boolean;
}


export default function WorkPlanForm({
  date,
  onCancel,
  onCreate,
  submitting = false,
}: Props) {
  const [project, setProject] =
    useState('');

  const [client, setClient] =
    useState('');

  const [environment, setEnvironment] =
    useState('');

  const [category, setCategory] =
    useState<
      WorkCategory | ''
    >('');

  const [taskTitle, setTaskTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [priority, setPriority] =
    useState<WorkPriority>(
      'Medium',
    );

  const [technologies, setTechnologies] =
    useState('');

  const [ticketId, setTicketId] =
    useState('');

  const [links, setLinks] =
    useState<WorkLink[]>([]);

  const [errors, setErrors] =
    useState<
      Record<string, string>
    >({});


  const projectRef =
    useRef<HTMLInputElement>(
      null,
    );


  const dialogRef =
    useModalAccessibility(
      onCancel,
      projectRef,
    );


  // ============================================================
  // Links
  // ============================================================

  const addLink = () => {
    setLinks(
      (previous) => [
        ...previous,
        {
          id: uuid(),
          type: '',
          url: '',
        },
      ],
    );
  };


  const updateLink = (
    id: string,
    field:
      | 'type'
      | 'url',
    value: string,
  ) => {
    setLinks(
      (previous) =>
        previous.map(
          (link) =>
            link.id === id
              ? {
                  ...link,
                  [field]:
                    value,
                }
              : link,
        ),
    );
  };


  const removeLink = (
    id: string,
  ) => {
    setLinks(
      (previous) =>
        previous.filter(
          (link) =>
            link.id !== id,
        ),
    );
  };


  // ============================================================
  // Validation
  // ============================================================

  const validate = (): boolean => {
    const next: Record<
      string,
      string
    > = {};


    if (
      !project.trim()
    ) {
      next.project =
        'Project is required.';
    }


    if (
      !taskTitle.trim()
    ) {
      next.taskTitle =
        'Task title is required.';
    }


    if (
      !description.trim()
    ) {
      next.description =
        'Description is required.';
    }


    setErrors(next);


    return (
      Object.keys(next)
        .length === 0
    );
  };


  // ============================================================
  // Submit
  // ============================================================

  const handleSubmit = () => {
    if (
      submitting ||
      !validate()
    ) {
      return;
    }


    const now =
      new Date().toISOString();


    /*
     * Work ID is intentionally blank.
     *
     * The API ignores this value and Lambda generates:
     *
     * WT-YYYYMMDD-NNN
     */
    const item: WorkItem = {
      id: uuid(),

      workId: '',

      date,

      project:
        project.trim(),

      client:
        client.trim() ||
        undefined,

      environment:
        environment.trim() ||
        undefined,

      category:
        category ||
        undefined,

      taskTitle:
        taskTitle.trim(),

      description:
        description.trim(),

      priority,

      technologies:
        technologies
          .split(',')
          .map(
            (technology) =>
              technology.trim(),
          )
          .filter(Boolean),

      ticketId:
        ticketId.trim() ||
        undefined,

      links:
        links.filter(
          (link) =>
            link.type.trim() &&
            link.url.trim(),
        ),

      status:
        'Planned',

      sessions: [],

      createdAt:
        now,

      updatedAt:
        now,
    };


    onCreate(item);
  };


  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="overlay">
      <div
        ref={dialogRef}
        className="modal modal-work-plan"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-plan-title"
        tabIndex={-1}
      >
        <div
          style={{
            display:
              'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
          }}
        >
          <h2
            id="work-plan-title"
            style={{
              fontSize: 18,
            }}
          >
            Set Today's Work Plan
          </h2>


          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost btn-sm"
            aria-label="Close"
            disabled={submitting}
          >
            Close
          </button>
        </div>


        <p
          style={{
            color:
              'var(--text-muted)',
            fontSize: 13,
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          What do you plan to work
          on? Start time is captured
          when you press Start, not
          now.
        </p>


        {/* ======================================================
            Metadata
        ====================================================== */}

        <div
          className="form-grid-2"
          style={{
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 14,
            marginTop: 16,
          }}
        >
          <div>
            <div className="field-label">
              Work ID
            </div>

            <div className="field-static">
              Assigned by AWS
            </div>
          </div>


          <div>
            <div className="field-label">
              Date
            </div>

            <div className="field-static">
              {date}
            </div>
          </div>
        </div>


        {/* ======================================================
            Work Context
        ====================================================== */}

        <div className="form-section-title">
          Work context
        </div>


        <div
          className="form-grid-2"
          style={{
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 14,
          }}
        >
          <Field
            label="Project"
            required
            error={
              errors.project
            }
          >
            <input
              ref={projectRef}
              className={`input ${
                errors.project
                  ? 'input-invalid'
                  : ''
              }`}
              value={project}
              onChange={(
                event,
              ) =>
                setProject(
                  event.target.value,
                )
              }
              disabled={
                submitting
              }
            />
          </Field>


          <Field
            label="Client"
            hint="optional"
          >
            <input
              className="input"
              value={client}
              onChange={(
                event,
              ) =>
                setClient(
                  event.target.value,
                )
              }
              disabled={
                submitting
              }
            />
          </Field>


          <Field
            label="Environment"
            hint="optional"
          >
            <input
              className="input"
              value={
                environment
              }
              onChange={(
                event,
              ) =>
                setEnvironment(
                  event.target.value,
                )
              }
              disabled={
                submitting
              }
            />
          </Field>


          <Field
            label="Category"
            hint="optional"
          >
            <select
              className="select"
              value={category}
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target
                    .value as
                    | WorkCategory
                    | '',
                )
              }
              disabled={
                submitting
              }
            >
              <option value="">
                —
              </option>

              {WORK_CATEGORIES.map(
                (value) => (
                  <option
                    key={value}
                    value={
                      value
                    }
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>


        {/* ======================================================
            Task
        ====================================================== */}

        <div className="form-section-title">
          Task
        </div>


        <Field
          label="Task Title"
          required
          error={
            errors.taskTitle
          }
        >
          <input
            className={`input ${
              errors.taskTitle
                ? 'input-invalid'
                : ''
            }`}
            value={
              taskTitle
            }
            onChange={(
              event,
            ) =>
              setTaskTitle(
                event.target
                  .value,
              )
            }
            disabled={
              submitting
            }
          />
        </Field>


        <Field
          label="Description"
          required
          error={
            errors.description
          }
        >
          <textarea
            className={`textarea ${
              errors.description
                ? 'input-invalid'
                : ''
            }`}
            style={{
              minHeight: 70,
            }}
            value={
              description
            }
            onChange={(
              event,
            ) =>
              setDescription(
                event.target
                  .value,
              )
            }
            disabled={
              submitting
            }
          />
        </Field>


        {/* ======================================================
            Tracking
        ====================================================== */}

        <div className="form-section-title">
          Tracking
        </div>


        <div
          className="form-grid-2"
          style={{
            display:
              'grid',
            gridTemplateColumns:
              '1fr 1fr',
            gap: 14,
          }}
        >
          <Field
            label="Priority"
            required
          >
            <select
              className="select"
              value={
                priority
              }
              onChange={(
                event,
              ) =>
                setPriority(
                  event.target
                    .value as
                    WorkPriority,
                )
              }
              disabled={
                submitting
              }
            >
              {WORK_PRIORITIES.map(
                (value) => (
                  <option
                    key={value}
                    value={
                      value
                    }
                  >
                    {value}
                  </option>
                ),
              )}
            </select>
          </Field>


          <Field
            label="Ticket / Incident ID"
            hint="optional"
          >
            <input
              className="input"
              value={
                ticketId
              }
              onChange={(
                event,
              ) =>
                setTicketId(
                  event.target
                    .value,
                )
              }
              disabled={
                submitting
              }
            />
          </Field>
        </div>


        <Field
          label="Technologies"
          hint="optional, comma-separated"
        >
          <input
            className="input"
            value={
              technologies
            }
            onChange={(
              event,
            ) =>
              setTechnologies(
                event.target
                  .value,
              )
            }
            disabled={
              submitting
            }
          />
        </Field>


        {/* ======================================================
            Resources
        ====================================================== */}

        <div className="form-section-title">
          Resources
        </div>


        <div
          style={{
            display:
              'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            marginBottom:
              8,
          }}
        >
          <span
            style={{
              color:
                'var(--text-muted)',
              fontSize: 13,
            }}
          >
            Links optional
          </span>


          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={
              addLink
            }
            disabled={
              submitting
            }
          >
            + Add link
          </button>
        </div>


        {links.map(
          (link) => (
            <div
              key={link.id}
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '140px 1fr auto',
                gap: 8,
                marginBottom:
                  8,
              }}
            >
              <input
                className="input"
                placeholder="Link type"
                value={
                  link.type
                }
                onChange={(
                  event,
                ) =>
                  updateLink(
                    link.id,
                    'type',
                    event.target
                      .value,
                  )
                }
                disabled={
                  submitting
                }
              />


              <input
                className="input"
                placeholder="https://..."
                value={
                  link.url
                }
                onChange={(
                  event,
                ) =>
                  updateLink(
                    link.id,
                    'url',
                    event.target
                      .value,
                  )
                }
                disabled={
                  submitting
                }
              />


              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  removeLink(
                    link.id,
                  )
                }
                disabled={
                  submitting
                }
                aria-label="Remove link"
              >
                ×
              </button>
            </div>
          ),
        )}


        {/* ======================================================
            Footer
        ====================================================== */}

        <div
          style={{
            display:
              'flex',
            justifyContent:
              'flex-end',
            gap: 8,
            marginTop:
              18,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={
              onCancel
            }
            disabled={
              submitting
            }
          >
            Cancel
          </button>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              handleSubmit
            }
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Creating...'
              : 'Create Work Item'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// Field helper
// ============================================================

function Field({
  label,
  hint,
  required = false,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom:
          12,
      }}
    >
      <div className="field-label">
        {label}

        {required && (
          <span>
            {' '}
            *
          </span>
        )}

        {hint && (
          <span
            style={{
              color:
                'var(--text-muted)',
              fontWeight:
                400,
            }}
          >
            {' '}
            · {hint}
          </span>
        )}
      </div>


      {children}


      {error && (
        <div
          style={{
            color:
              'var(--danger)',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
