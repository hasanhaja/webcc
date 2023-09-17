# WebCC

This is a compiler on top of the [WebC](https://github.com/11ty/webc) compiler, that can be used to author single file components in WebC and then port them to be used in other UI frameworks like React, Vue, SolidJS and Astro. The motivation behind this project is leverage the advantages of WebC over the Web Component standards, so the components can work in an SSR context as well. This is because WebC offers a powerful way to share markup, and when you use that as a mechanism to generate React components, for example, this works well with SSR.

The workflow for component development would be to author it using WebC, test it on a officially supported platform like 11ty, run it through the compiler and you get a framework component very similar to how you would've written it. This will be true for presentational, or stateless, components. For components with dynamic behavior, you would declare it as a custom element and that's what will drive the state and behavior of the component. I aim for this to be a very simple code splitting and splicing project and will not have the sophistication or complexity of a project like [Mitosis](https://github.com/BuilderIO/mitosis).  

## Planned exploration

- [x] React presentational components
- [x] Basic code generation and wiring for CSS and JS
- [x] Simple React wrapper for custom elements
- [x] Simple CLI interface
- [x] Debugging option for the CLI interface
- [ ] Auto detection of WebC props and attributes
- [ ] Fully supported custom elements wrapper in React
- [ ] Astro components
- [ ] Vue components
- [ ] Proper support for client components for React Server Components
