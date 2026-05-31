/*
================================================================
  data/questions.js — Wizard question definitions
================================================================
  Each question:
    id        — key stored in answers{} state
    text      — what the user reads
    options   — static array of { label, value }
    optionsFn — function(answers) => options[] for dynamic options
                set options: null when using optionsFn
    showIf    — function(answers) => boolean, or null (always show)

  TO ADD A QUESTION:
    1. Add an object to this array (order matters — top to bottom)
    2. Set showIf if it's conditional on a previous answer
    3. Add matching scoring logic in lib/scoring.js

  TO MAKE AN ANSWER CHANGE ANOTHER QUESTION'S OPTIONS:
    Use optionsFn instead of a static options array.
================================================================
*/

export const QUESTIONS = [
  {
    id: 'budget',
    text: "What's your budget?",
    showIf: null,
    optionsFn: null,
    options: [],
  },
  {
    id: 'goal',
    text: "What's your main goal?",
    showIf: null,
    options: null,
    // Options change based on whether budget is unlimited
    optionsFn: (answers) => {
      if (answers.budget === 'unlimited') {
        return [
          { label: 'Best for gaming',       value: 'gaming'       },
          { label: 'Best for productivity', value: 'productivity' },
          { label: 'Best of all time',      value: 'best'         },
        ];
      }
      return [
        { label: 'Maximize gaming',       value: 'gaming'       },
        { label: 'Maximize productivity', value: 'productivity' },
        { label: 'Mix of both',           value: 'balanced'     },
      ];
    },
  },
  {
    id: 'secondary',
    text: 'Do you have a secondary use?',
    showIf: null,
    optionsFn: null,
    options: [
      { label: 'Gaming on the side',       value: 'gaming'       },
      { label: 'Some productivity work',   value: 'productivity' },
      { label: 'Just the one main thing',  value: 'none'         },
    ],
  },
  {
    id: 'rgb',
    text: 'Do you want RGB lighting?',
    showIf: null,
    optionsFn: null,
    options: [
      { label: 'No RGB — clean look',              value: 'none'   },
      { label: 'Subtle — a little colour is fine', value: 'subtle' },
      { label: 'Full RGB everywhere',              value: 'full'   },
    ],
  },
  {
    id: 'glass',
    text: 'Glass side panel?',
    // Only shown if the user wants any RGB (pointless otherwise)
    showIf: (answers) => answers.rgb !== undefined && answers.rgb !== 'none',
    optionsFn: null,
    options: [
      { label: 'Yes — I want to see inside', value: 'yes' },
      { label: 'No — solid panel is fine',   value: 'no'  },
    ],
  },
  {
    id: 'cables',
    text: 'Do you care how the wires look inside?',
    // Only shown if user wants a glass panel
    showIf: (answers) => answers.glass === 'yes',
    optionsFn: null,
    options: [
      { label: 'Yes — hide everything behind the tray', value: 'yes' },
      { label: "No — doesn't matter",                   value: 'no'  },
    ],
  },
  {
    id: 'noise',
    text: 'Where will it live and how loud can it be?',
    // Not asked for unlimited budget — best cooling is included regardless
    showIf: (answers) => answers.budget !== 'unlimited',
    optionsFn: null,
    options: [
      { label: 'On my desk — needs to be quiet',      value: 'quiet'  },
      { label: 'On the floor — some noise is fine',   value: 'normal' },
      { label: "Anywhere — I don't care about noise", value: 'loud'   },
    ],
  },
];

/** Returns the subset of QUESTIONS visible given current answers */
export function getActiveQuestions(answers) {
  return QUESTIONS.filter((q) => q.showIf === null || q.showIf(answers));
}

/** Returns the options for a question (static or dynamic) */
export function getOptions(question, answers) {
  return question.optionsFn ? question.optionsFn(answers) : question.options;
}
