# Generative AI use during development

## 1. AI tools

I used GPT-5 primarily for the development of this Next.js site. It was capable of long-range context retention so I used it for code generation of major components and utilities. Occasionally, I used Copilot and Windsurf for speedy fixes of syntax problems and TypeScript complaints. Moreover, I used the Copilot plugin in VS Code for code auto-completion.

## 2. Prompting

AI tools contributed to choosing external libraries on NPM for feature implementation and bugfixing. Below are some example prompts:

- Q: "next.js find npm lib that gives drawing canvas functions"
- GPT-5 browsed the web and suggested react-konva / Konva, Fabric.js, etc. and gave brief descriptions. It also provided short code implementations of the two libraries. I adopted react-konva / Konva due to its popularity. It saved me a lot of time finding and comparing options, which might not be comprehensive.

- Q: "3 fingers needed for panning but should work for 2 fingers instead. no zooming function problem"
- GPT-5 added `onTouchMove` event handler, in addition to `onTouchStart` and `onTouchEnd` event handlers it previously generated. The handler detected two-point touches and determined to pan or zoom based on the change in distance between two fingers. The problem was perfectly solved but it did not mention the need to attach it to the Konva stage.
  
- Q: "dialog mui disable clickaway"
- Copilot stated that the `onClose` event handler receives a reason like `backdropClick`, `escapeKeyDown`, etc. It also recommended disabling the Escape key, which I did not think of before asking.

## 3. Project evolution

The use of AI tools in coding was very smooth. I started with prototyping and refining components. However, as the code became longer, I tried not to input the entire file to avoid the LLM losing focus. The only problem that multiple LLMs failed to solve was flickering issues when an image was selected in the dialog. It required manual debugging eventually. It was possibly due to the use of an experimental feature of Mui without much documentation and code online.