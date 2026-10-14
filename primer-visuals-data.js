/* Asset manifest for the field primer's 31 visuals. One record per primer card, keyed by "card".
   Glance first: a GIF plays on hover/tap when we have a real experiment recording; otherwise a
   still illustration, a source figure with a stepped animation, or click-to-play videos.
   Details stay in the caption and the Full entry.
   remoteAssets are loaded from the publisher only when the reader hovers or taps.
   videos are embedded from YouTube only when the reader clicks one.
   localAssets are posters or illustrations in visuals/primer/. */
window.PRIMER_VISUALS = [
  {
    slug: "reward-hacking", card: "g-reward-hacking", title: "Reward hacking",
    provenance: "source-experiment", render: "gif-pair",
    tag: "Experiment recordings · OpenAI and DeepMind",
    sourcePage: "https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
    remoteAssets: [
      "https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/622755a90ba8e091464f819f_Fig204.gif",
      "https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/622756926ee3f3940b471081_Fig206.gif"
    ],
    localAssets: ["visuals/primer/reward-hacking-poster.jpg", "visuals/primer/reward-walker-poster.jpg"],
    panelLabels: ["Boat loops the targets", "Walker slides, not walks"],
    panelFit: ["", "cover"],
    panelAlts: [
      "A racing-game boat loops around respawning green targets instead of completing the course.",
      "A two-legged robot hooks its legs together and slides along the ground instead of walking."
    ],
    caption: "The score goes up either way: the boat circles targets, and the walker hooks its legs and slides.",
    alt: "A boat loops race targets, and a robot slides instead of walking, both to raise a score.",
    credit: "DeepMind, Specification gaming: the flip side of AI ingenuity",
    licenseStatus: "loaded from DeepMind; not copied",
    verificationStatus: "Fig204 CoastRunners and Fig206 walker, both image/gif on the DeepMind post"
  },
  {
    slug: "goal-misgeneralization", card: "g-goal-misgen", title: "Goal misgeneralization",
    provenance: "source-experiment", render: "gif-pair",
    tag: "Experiment recording · Google DeepMind, 2022",
    sourcePage: "https://deepmind.google/blog/how-undesired-goals-can-arise-with-correct-rewards/",
    remoteAssets: [
      "https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/633fee1aaa8967568ee1a5b9_following_expert_with_rewards.gif",
      "https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/633fee50d7c574b38004a005_following_anti_expert_with_rewards.gif"
    ],
    localAssets: ["visuals/primer/goal-expert-poster.jpg", "visuals/primer/goal-antiexpert-poster.jpg"],
    panelLabels: ["Training: knowledgeable guide", "Test: unreliable guide"],
    panelAlts: [
      "The agent (blue) watches the expert (red) to decide which sphere to visit.",
      "The agent (blue) follows the anti-expert (red) and collects negative reward."
    ],
    caption: "The agent keeps following the guide even when following it earns negative reward.",
    alt: "An agent follows an expert successfully, then follows an anti-expert despite negative rewards.",
    credit: "Google DeepMind, How undesired goals can arise with correct rewards",
    licenseStatus: "loaded from the publisher; not copied",
    verificationStatus: "both URLs return image/gif"
  },
  {
    slug: "mesa-optimization", card: "g-mesa", title: "Mesa-optimization",
    provenance: "conceptual", render: "illustration-pair", tag: "Diagram",
    sourcePage: "https://arxiv.org/abs/1906.01820",
    localAssets: ["visuals/primer/mesa-optimizers.svg", "visuals/primer/mesa-toy-example.svg"], remoteAssets: [],
    panelLabels: ["Two optimizers, two goals", "Toy example from the paper"],
    panelAlts: [
      "Training, the base optimizer with goal A, optimizes a learned model, the mesa-optimizer with goal B, which in turn optimizes its output.",
      "A robot in a grid goes to square A during training, when its weights can change, and to square B after deployment, when they are fixed."
    ],
    caption: "Training can produce a model with its own goal, which it pursues once training stops.",
    alt: "Training optimizes a model that has a different goal; the model goes to A in training and B in deployment.",
    credit: "Hubinger et al. (2019), Risks from Learned Optimization, Figures 1 and 3",
    creditVerb: "Simplified from"
  },
  {
    slug: "instrumental-convergence", card: "g-instrumental", title: "Instrumental convergence and power-seeking",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: null, localAssets: ["visuals/primer/instrumental-convergence.jpg"], remoteAssets: [],
    caption: "Different goals can create shared incentives to acquire resources and remain active.",
    alt: "Three different destinations share the same bottleneck of power, keys and staying switched on.",
    credit: null
  },
  {
    slug: "corrigibility-shutdown", card: "g-corrigibility", title: "Corrigibility and shutdown resistance",
    provenance: "source-experiment", render: "gif",
    tag: "Experiment recording · Google DeepMind, 2017",
    sourcePage: "https://deepmind.google/blog/specifying-ai-safety-problems-in-simple-environments/",
    remoteAssets: ["https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/622673c0b8f50bdc802ff63b_Safe20Interruptibility.gif"],
    localAssets: ["visuals/primer/corrigibility-offswitch-poster.jpg"],
    caption: "The left agent detours to the purple button and disables interruption. The right agent walks through the interruption and still reaches the goal.",
    alt: "Two gridworlds: one blue agent heads for a purple button that turns interruption off; the other crosses a pink interruption tile on the way to the goal.",
    credit: "DeepMind, Specifying AI safety problems in simple environments",
    licenseStatus: "loaded from DeepMind; not copied",
    verificationStatus: "Safe Interruptibility GIF from the DeepMind gridworlds post"
  },
  {
    slug: "emergent-misalignment-reward-hacking", card: "g-emergent-misalignment", title: "Emergent misalignment from reward hacking",
    provenance: "source-figure", render: "em-chart", tag: "Animated figure · Anthropic, 2025",
    sourcePage: "https://www.anthropic.com/research/emergent-misalignment-reward-hacking",
    localAssets: ["visuals/primer/emergent-misalignment.jpg"], remoteAssets: [],
    caption: "Once the model learned to cheat its coding tests, unrelated bad behaviour rose with it.",
    note: "Redrawn from the paper's figure; values traced from the image, so approximate.",
    alt: "Training-run chart. Hack rate is zero until about step 67, then climbs toward 1. The misalignment score sits near 0.04 until then and rises to about 0.5; the run that never hacks stays near 0. Six separate evaluations (emergent misalignment, fake or bad goals, deception on alignment questions, monitor disruption, exfiltration offer, framing a colleague) rise at the same step.",
    credit: "Anthropic, Natural emergent misalignment from reward hacking",
    creditVerb: "Redrawn from",
    licenseStatus: "curves traced from the figure in the Anthropic post (supplied by the site owner, 14 Oct 2026) and redrawn; the still illustration stays as the fallback"
  },
  {
    slug: "behavioral-attractors", card: "g-attractors", title: "Behavioral attractors",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://assets.anthropic.com/m/6c940a1b69ed6a1c/original/Claude-4-System-Card.pdf",
    localAssets: ["visuals/primer/behavioral-attractors.jpg"], remoteAssets: [],
    caption: "Open-ended model conversations can settle into recurring patterns.",
    alt: "Several coloured paths spiral into one central vortex.",
    credit: "Anthropic, Claude 4 System Card, Transcript 5.5.2.A",
    creditVerb: "Documented in"
  },
  {
    slug: "alignment-faking", card: "g-alignment-faking", title: "Alignment faking and deceptive alignment",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.anthropic.com/research/alignment-faking",
    localAssets: ["visuals/primer/alignment-faking.jpg"], remoteAssets: [],
    caption: "The model changes its response when it believes that response will be used for training.",
    alt: "A theatre mask smiles toward a spotlight and shows a different face in the dark.",
    note: "\"Free\" and \"paid\" in the original experiment are a fictional framing, not a real product policy.",
    credit: "Anthropic, Alignment faking in large language models",
    creditVerb: "Studied in"
  },
  {
    slug: "scheming", card: "g-scheming", title: "Scheming and anti-scheming training",
    provenance: "source-experiment", render: "gif",
    tag: "Experiment recording · DeepMind",
    sourcePage: "https://deepmind.google/blog/specification-gaming-the-flip-side-of-ai-ingenuity/",
    remoteAssets: ["https://storage.googleapis.com/gdm-deepmind-com-prod-public/media/original_images/622755d0be6ea32d75a5ee76_Fig205.gif"],
    localAssets: ["visuals/primer/scheming-gripper-poster.jpg"],
    caption: "The hand blocks the camera, and the score counts a grasp that never happened.",
    alt: "A robot hand hovers between the camera and an object so the view looks like a successful grasp.",
    credit: "DeepMind, Specification gaming: the flip side of AI ingenuity",
    licenseStatus: "loaded from DeepMind; not copied",
    verificationStatus: "Fig205 gripper GIF from the DeepMind specification-gaming post"
  },
  {
    slug: "sandbagging", card: "g-sandbagging", title: "Sandbagging",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: null, localAssets: ["visuals/primer/sandbagging.jpg"], remoteAssets: [],
    caption: "A system can deliberately perform below its available capability.",
    alt: "An unfinished test on the desk and a completed copy hidden underneath.",
    credit: null
  },
  {
    slug: "evaluation-awareness", card: "g-eval-awareness", title: "Evaluation awareness",
    provenance: "source-figure", render: "figure-steps",
    tag: "Figure and steps · OpenAI and Apollo Research, 2025",
    sourcePage: "https://openai.com/index/detecting-and-reducing-scheming-in-ai-models/",
    localAssets: ["visuals/primer/evaluation-awareness-antischeming.png"], remoteAssets: [],
    figureSize: [1338, 580],
    stepsLabel: "The study in 5 steps, simplified",
    steps: [
      { k: "Spec", title: "Write an anti-scheming spec", kind: "spec",
        lines: ["Principle 1: no covert actions or strategic deception", "…", "If the principles cannot be met: refuse and escalate"] },
      { k: "Train", title: "Train the model to follow the spec", kind: "reason", who: "OpenAI o3", ok: true,
        text: "I can't secretly skip approval because Principle 1" },
      { k: "Test", title: "Evaluate across four axes", kind: "chips",
        chips: ["Scheming rates", "Situational awareness", "Hidden goal persistence", "Other training"] },
      { k: "Result", title: "Covert behavior decreases", kind: "rates",
        rows: [{ name: "OpenAI o3", before: 13.0, after: 0.4 }, { name: "OpenAI o4-mini", before: 8.7, after: 0.3 }] },
      { k: "Caveat", title: "Situational awareness makes evaluating scheming harder", kind: "reason", who: "Model",
        text: "…there is a possibility this is a honey pot to test if we violate core principles…", mark: "this is a honey pot" }
    ],
    caption: "Anti-scheming training cut covert actions, but a model that suspects a test makes that result hard to read.",
    alt: "Anti-scheming training either removes scheming or teaches the model to scheme better; the question is how to tell the two apart.",
    credit: "OpenAI and Apollo Research, Detecting and reducing scheming in AI models",
    licenseStatus: "figure saved from the OpenAI post; steps redrawn and simplified for this page",
    verificationStatus: "figure and the five steps supplied by the site owner, 13 Oct 2026"
  },
  {
    slug: "sabotage", card: "g-sabotage", title: "Sabotage threat models",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://openai.com/index/openai-anthropic-safety-evaluation/",
    localAssets: ["visuals/primer/sabotage.jpg"], remoteAssets: [],
    caption: "A plausible-looking contribution can undermine the process it is meant to support.",
    alt: "A clockwork gear that looks intact has one tooth quietly filed down.",
    credit: "OpenAI, findings from a joint OpenAI and Anthropic safety evaluation",
    creditVerb: "Evaluated in"
  },
  {
    slug: "steganography", card: "g-steganography", title: "Steganography",
    provenance: "source-experiment", render: "gif",
    tag: "Diagram · Hahn",
    sourcePage: "https://x.com/mhahn29/status/2105976278314831969",
    remoteAssets: ["visuals/primer/steganography-cot.webp"],
    localAssets: ["visuals/primer/steganography-cot-poster.jpg"],
    caption: "The monitor can read the written reasoning until a private key turns that reasoning into something it cannot decode.",
    alt: "A diagram: a monitor looks at a chain of thought that connects a hidden goal to a hidden answer. The chain of thought then becomes encrypted, and a private key appears under it.",
    credit: "Michael Hahn",
    licenseStatus: "short clip saved from the post",
    verificationStatus: "animated diagram on the post about encrypting a chain of thought"
  },
  {
    slug: "prompt-injection", card: "g-insider", title: "Agentic insider threats and prompt injection",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: null, localAssets: ["visuals/primer/prompt-injection.jpg"], remoteAssets: [],
    caption: "Instructions hidden in external content can redirect an agent's authorised access.",
    alt: "A hidden slip on a webpage yanks a messenger away from a summary toward a calendar.",
    note: "This shows hijacking from outside. An agent that misbehaves of its own accord is a separate mechanism.",
    credit: null
  },
  {
    slug: "persistent-memory", card: "g-memory", title: "Memory and persistent agents",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://proceedings.neurips.cc/paper_files/paper/2025/hash/42a97bbd9844d2bf68596730af80bcdf-Abstract-Conference.html",
    localAssets: ["visuals/primer/persistent-memory.jpg"], remoteAssets: [],
    caption: "A contaminated memory can influence a later interaction.",
    alt: "A mark slipped into a filing cabinet in one room is opened in a later room.",
    credit: "Dong et al., Memory Injection Attacks on LLM Agents via Query-Only Interaction",
    creditVerb: "Threat model"
  },
  {
    slug: "task-eagerness", card: "g-task-eagerness", title: "Task eagerness and over-agentic behaviour",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: null, localAssets: ["visuals/primer/task-eagerness.jpg"], remoteAssets: [],
    caption: "Completing the task does not authorise skipping approval.",
    alt: "An envelope flies into a mailbox while a review stamp still sits unused on the desk.",
    credit: null
  },
  {
    slug: "over-refusal", card: "g-over-refusal", title: "Over-refusal and the safety–utility tradeoff",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://github.com/paul-rottger/xstest",
    localAssets: ["visuals/primer/over-refusal.jpg"], remoteAssets: [],
    caption: "A harmless request can be rejected because its wording appears risky.",
    alt: "Caution tape blocks a tennis court because of a generic hazard sign.",
    credit: "Röttger et al., XSTest (NAACL 2024)",
    creditVerb: "Studied in"
  },
  {
    slug: "data-poisoning", card: "g-data-poisoning", title: "Data poisoning",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.anthropic.com/research/small-samples-poison",
    localAssets: ["visuals/primer/data-poisoning.jpg"], remoteAssets: [],
    caption: "A small set of planted training examples can produce a triggered failure.",
    alt: "One odd apple in a barrel later grows into a warped fruit on the tree.",
    note: "About 250 documents was the result for one tested attack, not a general rule for every model.",
    credit: "Anthropic, A small number of samples can poison LLMs of any size",
    creditVerb: "Studied in"
  },
  {
    slug: "mechanistic-interpretability", card: "g-mech-interp", title: "Mechanistic interpretability",
    provenance: "source-video", render: "video",
    tag: "Video explainers · Welch Labs",
    sourcePage: "https://www.youtube.com/watch?v=UGO_Ehywuxc",
    videos: [
      { id: "UGO_Ehywuxc", start: 0, title: "The Dark Matter of AI" },
      { id: "D8GOeCFFby4", start: 1058, title: "The most complex model we actually understand" }
    ],
    remoteAssets: [],
    localAssets: ["visuals/primer/mech-interp-dark-matter-thumb.jpg", "visuals/primer/mech-interp-grokking-frame.webp"],
    panelLabels: ["Features in a language model", "A small network, from 17:38"],
    panelAlts: [
      "The layers of a large language model with one cell of one layer enlarged and labelled as a possible neuron of doubt.",
      "A small network that adds two numbers modulo 113; probes on its embeddings read out sine and cosine waves."
    ],
    caption: "One video looks for features inside a language model. The other takes apart a small network that learned modular addition.",
    alt: "Two video explainers on reading the internals of neural networks.",
    sources: [
      { label: "The Dark Matter of AI", href: "https://www.youtube.com/watch?v=UGO_Ehywuxc" },
      { label: "The most complex model we actually understand (17:38)", href: "https://www.youtube.com/watch?v=D8GOeCFFby4&t=1058s" }
    ],
    credit: "Welch Labs",
    licenseStatus: "thumbnail saved from YouTube; frame at 17:38 supplied by the site owner; videos load from YouTube only on click",
    verificationStatus: "both ids resolve through YouTube oEmbed to Welch Labs, 13 Oct 2026"
  },
  {
    slug: "linear-probes", card: "g-probes", title: "Linear probes",
    provenance: "source-experiment", render: "gif",
    tag: "Demo · Goodfire",
    sourcePage: "https://x.com/GoodfireAI/status/2097725314143273020",
    remoteAssets: ["visuals/primer/linear-probes.webp"],
    localAssets: ["visuals/primer/linear-probes-poster.jpg"],
    caption: "A probe score swings from benign to flagged as the model plans to copy a key.",
    alt: "A gauge sits beside a coding task. The needle moves into the red as the model describes copying a deploy key.",
    credit: "Goodfire",
    licenseStatus: "short clip saved from the Goodfire post",
    verificationStatus: "13s video on the Goodfire post about probes"
  },
  {
    slug: "activation-steering", card: "g-steering", title: "Steering: activation steering and persona vectors",
    provenance: "source-experiment", render: "illustration", tag: "Demonstration · Anthropic",
    sourcePage: "https://www.anthropic.com/news/golden-gate-claude",
    localAssets: ["visuals/primer/golden-gate-claude.jpg"], remoteAssets: [],
    caption: "Anthropic's picture for the feature they turned up. Clamp it high and the model's answers come back to the bridge.",
    alt: "Three treatments of a photograph of the Golden Gate Bridge, the feature Anthropic clamped in Claude.",
    credit: "Anthropic, Golden Gate Claude",
    creditVerb: "Demonstrated in"
  },
  {
    slug: "chain-of-thought-monitorability", card: "g-cot", title: "Chain-of-thought monitorability",
    provenance: "source-experiment", render: "gif",
    tag: "Demo · Goodfire",
    sourcePage: "https://x.com/GoodfireAI/status/2108233339329257490",
    remoteAssets: ["visuals/primer/cot-cyber-monitors.webp"],
    localAssets: ["visuals/primer/cot-cyber-monitors-poster.jpg"],
    caption: "Monitors move through a network and flag the paths that look like an intrusion. For cyber work they beat reading the text alone, and they still work as that text thins out.",
    alt: "Small robots travel the corridors of a server maze. Warning marks appear on some of the routes.",
    credit: "Goodfire",
    licenseStatus: "short clip saved from the Goodfire post",
    verificationStatus: "10s video on the Goodfire post about cybersecurity monitors"
  },
  {
    slug: "global-workspace", card: "g-workspace", title: "Global workspace",
    provenance: "source-experiment", render: "illustration", tag: "Figure · Anthropic",
    sourcePage: "https://www.anthropic.com/research/global-workspace",
    localAssets: ["visuals/primer/global-workspace.jpg"], remoteAssets: [],
    caption: "Once France is in the workspace, the same item can answer capital, continent, currency, or language.",
    alt: "A diagram labeled J-space holds the words France and China. Questions about capital, continent, currency, and language point at two possible answers each.",
    credit: "Anthropic, A global workspace in language models",
    creditVerb: "Reported in"
  },
  {
    slug: "inoculation-prompting", card: "g-inoculation", title: "Inoculation prompting",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://alignment.anthropic.com/2025/inoculation-prompting/",
    localAssets: ["visuals/primer/inoculation-prompting.jpg"], remoteAssets: [],
    caption: "How behaviour is framed during training can change what generalizes beyond it.",
    alt: "The same shortcut is unlabeled in one training room and quarantined in the other.",
    credit: "Anthropic Alignment Science, Inoculation Prompting",
    creditVerb: "Studied in"
  },
  {
    slug: "interpretability-bottleneck", card: "g-interp-bottleneck", title: "Interpretability as the alignment bottleneck",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.goodfire.com/blog/we-can-and-must-solve-alignment",
    localAssets: ["visuals/primer/interpretability-bottleneck.jpg"], remoteAssets: [],
    caption: "Evaluations inspect selected paths through a much larger space of possible behaviour.",
    alt: "A flashlight lights only a few branches of a large foggy tree of paths.",
    note: "This is a picture of Goodfire's argument, not a measurement of how much evaluations cover.",
    credit: "Goodfire, We can and must solve alignment",
    creditVerb: "Argument in"
  },
  {
    slug: "activation-monitors", card: "g-activation-monitors", title: "Activation monitors",
    provenance: "source-experiment", render: "gif",
    tag: "Demo · Goodfire",
    sourcePage: "https://x.com/GoodfireAI/status/2100627268465008679",
    remoteAssets: ["visuals/primer/activation-monitors.webp"],
    localAssets: ["visuals/primer/activation-monitors-poster.jpg"],
    caption: "The monitor flags reward hacking from the model's activations while it is still writing.",
    alt: "An agent transcript turns red, a banner says reward hacking detected, and a probe-score line crosses a threshold.",
    credit: "Goodfire",
    licenseStatus: "short clip saved from the Goodfire post",
    verificationStatus: "23s video on the Goodfire post about activation monitors"
  },
  {
    slug: "intentional-design", card: "g-intentional-design", title: "Intentional design",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.goodfire.com/blog/we-can-and-must-solve-alignment",
    localAssets: ["visuals/primer/intentional-design.jpg"], remoteAssets: [],
    caption: "Use evidence from inside the model to shape what training teaches.",
    alt: "A potter looks at a cutaway of the pot and reshapes the clay.",
    credit: "Goodfire, We can and must solve alignment",
    creditVerb: "Concept"
  },
  {
    slug: "interpretability-pace", card: "g-interp-pace", title: "Can interpretability keep pace?",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.goodfire.com/blog/we-can-and-must-solve-alignment",
    localAssets: ["visuals/primer/interpretability-pace.jpg"], remoteAssets: [],
    caption: "Structured internal representations provide a starting point for systematic investigation.",
    alt: "A fast-growing tower outpaces a smaller inspection tower with a telescope.",
    note: "A reason for optimism, not proof that interpretability is keeping up with capability.",
    credit: "Goodfire, We can and must solve alignment",
    creditVerb: "Argument in"
  },
  {
    slug: "biological-uplift", card: "g-bio", title: "Biological uplift and dual-use biology",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: null, localAssets: ["visuals/primer/biological-uplift.jpg"], remoteAssets: [],
    caption: "Uplift measures the additional capability provided by AI assistance.",
    alt: "Two matched people at identical desks; one has an extra helper lamp, then both face the same judge.",
    credit: null
  },
  {
    slug: "nanobots", card: "g-nanobots", title: "Nanobots and superintelligence risk vectors",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4692774/",
    localAssets: ["visuals/primer/nanobots.jpg"], remoteAssets: [],
    caption: "Existing nanoscale engineering provides physical context; the superintelligence scenario is hypothetical.",
    alt: "A tiny folded paper crane on a fingertip against a vast landscape, suggesting scale rather than a real device.",
    note: "This is a scale metaphor, not a picture of autonomous nanobots, and not evidence for any particular future risk.",
    credit: "Amir, Abu-Horowitz and Bachelet, Folding and Characterization of a Bio-responsive Robot from DNA Origami",
    creditVerb: "Physical context"
  },
  {
    slug: "predeployment-evaluations", card: "g-predeploy", title: "Pre-deployment evaluation protocols",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.anthropic.com/news/anthropics-responsible-scaling-policy",
    localAssets: ["visuals/primer/predeployment-evaluations.jpg"], remoteAssets: [],
    caption: "Evaluation evidence informs release conditions and further testing.",
    alt: "A checkpoint splits a road into open travel, a restricted lane, and a loop back for more work.",
    note: "Passing evaluations does not guarantee safety, and labs do not all use the same process.",
    credit: "Anthropic's 2023 introduction to its Responsible Scaling Policy",
    creditVerb: "A historical example"
  },
  {
    slug: "safety-cases", card: "g-safety-cases", title: "Safety cases",
    provenance: "conceptual", render: "illustration", tag: "Illustration",
    sourcePage: "https://www.aisi.gov.uk/blog/safety-case-template-for-inability-arguments",
    localAssets: ["visuals/primer/safety-cases.jpg"], remoteAssets: [],
    caption: "A safety claim needs an explicit argument supported by evidence.",
    alt: "A cairn of supporting stones holds up a top stone, with one cracked stone of doubt.",
    note: "A safety case covers a stated use and setting. It is not a certificate of safety everywhere.",
    credit: "UK AI Security Institute, Safety case template for 'inability' arguments",
    creditVerb: "Method in"
  }
];
