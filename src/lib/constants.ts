import { SliderDimension, SliderValues } from "./types";

export const SLIDER_DIMENSIONS: SliderDimension[] = [
  {
    key: "pacing",
    label: "Pacing",
    lowLabel: "Slow burn",
    highLabel: "Page-turner",
  },
  {
    key: "character_depth",
    label: "Character Depth",
    lowLabel: "Plot-driven",
    highLabel: "Character-driven",
  },
  {
    key: "emotional_weight",
    label: "Emotional Weight",
    lowLabel: "Light / humorous",
    highLabel: "Emotionally heavy",
  },
  {
    key: "plot_complexity",
    label: "Plot Complexity",
    lowLabel: "Straightforward",
    highLabel: "Intricate",
  },
  {
    key: "prose_style",
    label: "Prose Style",
    lowLabel: "Sparse / direct",
    highLabel: "Lush / literary",
  },
  {
    key: "mood",
    label: "Mood",
    lowLabel: "Dark / gritty",
    highLabel: "Hopeful / warm",
  },
  {
    key: "spice_level",
    label: "Spice Level",
    lowLabel: "Clean",
    highLabel: "Steamy",
  },
  {
    key: "world_building",
    label: "World Building",
    lowLabel: "Grounded",
    highLabel: "Expansive",
  },
];

export const DEFAULT_SLIDER_VALUES: SliderValues = {
  pacing: 5,
  character_depth: 5,
  emotional_weight: 5,
  plot_complexity: 5,
  prose_style: 5,
  mood: 5,
  spice_level: 5,
  world_building: 5,
};

export const TRAIT_KEYS = SLIDER_DIMENSIONS.map((d) => d.key);
