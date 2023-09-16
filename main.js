import { WebC } from "@11ty/webc";
import { mkdir, readFile, writeFile } from "node:fs/promises";

/**
 *  Cleans up the markup to be more React JSX friendly.
 *  @param {{ snippet: string; isCustomElement: boolean; tag: string;}} Markup with metadata
 *  @returns {string} Reformatted markup.
 */
const sanitizeMarkup = ({ snippet, isCustomElement, tag }) => {
  let result = snippet;
  result = result.replaceAll("class=", "className=");

  if (isCustomElement) {
    // TOOD Come up with a better way to handle this so web component props are not missed
    result = result.replaceAll(`<${tag}>`, `<${tag} ref={wc}>`) 
  }

  return result;
};

/**
 *  Extracts the name of the target component from the source WebC component
 *  @param {object} props - Props of the component
 *  @returns {{types: string; params: string;} | undefined} Props formatted into types and component props.
 */
const formatProps = (props) => {
  if (typeof props === "undefined") {
    return undefined;
  }

  const types = Object.entries(props).map(([ prop, propType ]) => `${prop}: ${propType};`).join(" ");
  const params = Object.keys(props).map((prop) => `${prop}`).join(", ");

  return {
    types: `{${types}}`,
    params:`{ ${params} }`,
  };
};

/**
 *  Converts parts of the component including markup, styles and web component JS into a React component.
 *  @param {{ snippet: string; styles: string; name: string; props: string; js: string; tag: string;}} parts - Parts of a component.
 *  @returns {{ component: string; styles: string; name: string; js: string;}} partsToWrite - Parts to be written to disk.
 */
const toReactComponent = ({ snippet, styles, name, props, js, tag }) => {
  const { types, params } = formatProps(props) ?? {};

  const boilerplate = `
    // This component was auto-generated from a WebC template
    ${ styles ? `import "./index.css";` : "" }
    ${ js ? `import "./web-component.js";\nimport { useRef } from 'react';` : "" }
    ${ types ? `type ${name}Props = ${types};` : "" }
    export const ${name} = (${params ?? ""}) => {
      ${ js ? "const wc = useRef(null);" : "" }
      return (
        <>
          ${sanitizeMarkup({ snippet, isCustomElement: js !== undefined, tag})}
        </>
      );
    }

    export default ${name};
  `;
    
  return {
    component: boilerplate,
    styles,
    name,
    js,
  };
};

/**
 *  Writes parts of the component to disk.
 *  @param {{ component: string; name: string; styles: string; js: string; outputDir: string;}} parts - Parts required to write component to disk.
 */
const toReactComponentFile = async ({ component, name, styles, js, outputDir}) => {
  const componentFileName = "index.tsx";
  const stylesFileName = "index.css";
  const jsFileName = "web-component.js";
  const componentDir = `./${outputDir}/components/${name}`;
  
  const componentDirUrl = new URL(componentDir, import.meta.url);
  await mkdir(componentDirUrl, { recursive: true });

  await writeFile(`${componentDir}/${componentFileName}`, component);

  if (styles) {
    await writeFile(`${componentDir}/${stylesFileName}`, styles);
  }

  if (js) {
    const boilerplate = `
      if(typeof window !== "undefined" && ("customElements" in window)) {
        ${js}
      }
    `;

    await writeFile(`${componentDir}/${jsFileName}`, boilerplate);
  }
};

/**
 *  Capitalizes the first letter of a work
 *  @param {string} word - Word to be capitalized.
 *  @returns {string} capitalizedWord - Capitalized word.
 */
const capitalize = (word) => word[0].toUpperCase() + word.substr(1).toLowerCase();

/**
 *  Extracts the name of the target component from the source WebC component
 *  @param {string} path - Path of the WebC component.
 *  @returns {string | undefined} componentName - Name of the component if regex matches.
 */
const getComponentName = (path) => {
  const regex = /\/([^/]+)\.webc$/;
  const match = path.match(regex);
  
  if (match) {
    const componentName = match[1];

    const name = componentName.split("-")
      .map(capitalize)
      .join("");
    return { 
      name, 
      tag: componentName,
    };
  }

  return undefined;
};

/**
 *  Compiles the WebC component to constituent parts with some additional formatting.
 *  @param {string} path - Path of the WebC component.
 *  @param {string | undefined} schema - Path to the JSON file with the component props.
 *  @returns {Promise<{ snippet: string; styles: string; name: string; props: string; js: string; tag: string;}>} parts - Parts of a component.
 */
const compile = async (path, schema) => {
  const component = new WebC();

  // This enables aggregation of CSS and JS
  // As of 0.4.0+ this is disabled by default
  component.setBundlerMode(true);
  component.defineComponents("./components/**.webc");

  const filePath = new URL(path, import.meta.url);
  const contents = await readFile(filePath, { encoding: "utf8" });
  component.setContent(contents);

  // TODO Add error handling for when missing props throws an error
  let data, props;

  if (schema) {
    const schemaPath = new URL(schema, import.meta.url);
    const propsContents = await readFile(schemaPath, { encoding: "utf8" });
    props = JSON.parse(propsContents);
    data = Object.fromEntries(Object.keys(props).map((key) => [`${key}`, `{${key}}`]));
  }
  
  let { html, css, js: rawJs, components } = await component.compile(data ? { data } : undefined);

  const { name, tag } = getComponentName(path);
  let snippet = html.trim();
  const js = rawJs?.join("").trim();

  if (js?.includes("customElements.define")) {
    snippet = `
      <${tag}>
        ${html}
      </${tag}>
    `;
  }

  
  return {
    snippet: snippet.trim(),
    styles: css[0]?.trim(),
    name: name ?? "Component",
    props,
    js,
    tag,
  }
};

// const result = await compile("./components/component-with-props.webc", "./components/component-with-props.json");
// const result = await compile("./components/my-greeting.webc");

// await toReactComponentFile({...toReactComponent(result), outputDir: "output", });

const reactify = async (filename, outputDir) => {
  const result = await compile(filename);
  await toReactComponentFile({...toReactComponent(result), outputDir, });
};

export {
  reactify,
  compile,
  toReactComponent,
};

