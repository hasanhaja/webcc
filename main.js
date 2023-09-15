import { WebC } from "@11ty/webc";
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sanitizeMarkup = ({ snippet, isCustomElement, tag }) => {
  let result = snippet;
  result = result.replaceAll("class=", "className=");

  if (isCustomElement) {
    result = result.replaceAll(`<${tag}>`, `<${tag} ref={wc}>`) 
  }

  return result;
};

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

const toReactComponent = ({ snippet, styles, name, props, js, tag }) => {
  const { types, params } = formatProps(props) ?? {};

  const boilerplate = `
    // This component was auto-generated from a WebC template
    ${ styles ? `import "./index.css";` : "" }
    ${ js ? `import "./web-component.js";\nimport { useRef } from 'react';` : "" }
    ${ types ? `type ${name}Props = ${types};` : "" }
    export const ${name} = (${params ?? ""}) => {
      const wc = useRef(null);
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

const capitalize = (word) => word[0].toUpperCase() + word.substr(1).toLowerCase();

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

const compile = async (path, schema) => {
  let page = new WebC();

  // This enables aggregation of CSS and JS
  // As of 0.4.0+ this is disabled by default
  page.setBundlerMode(true);
  page.defineComponents("./components/**.webc");

  const filePath = new URL(path, import.meta.url);
  const contents = await readFile(filePath, { encoding: "utf8" });
  page.setContent(contents);

  let data, props;

  if (schema) {
    const schemaPath = new URL(schema, import.meta.url);
    const propsContents = await readFile(schemaPath, { encoding: "utf8" });
    props = JSON.parse(propsContents);
    data = Object.fromEntries(Object.keys(props).map((key) => [`${key}`, `{${key}}`]));
  }
  
  let { html, css, js: rawJs, components } = await page.compile(data ? { data } : undefined);

  const { name, tag } = getComponentName(path);
  let snippet = html;
  const js = rawJs[0];

  if (js.includes("customElements.define")) {
    snippet = `
      <${tag}>
        ${html}
      </${tag}>
    `;
  }

  // console.log("----HTML----");
  // console.log(snippet);
  // console.log("------------");

  // console.log("-----JS-----");
  // console.log(js);
  // console.log("------------");

  return {
    snippet,
    styles: css[0],
    name: name ?? "Component",
    props,
    js,
    tag,
  }
};

// const result = await compile("./components/component-with-props.webc", "./components/component-with-props.json");
const result = await compile("./components/my-greeting.webc");

await toReactComponentFile({...toReactComponent(result), outputDir: "output", });

