import { WebC } from "@11ty/webc";
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sanitizeMarkup = (snippet) => {
  let result = snippet;
  result = result.replaceAll("class=", "className=");
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

const toReactComponent = ({ snippet, styles, name, props }) => {
  const { types, params } = formatProps(props) ?? {};

  const boilerplate = `
    // This component was auto-generated from a WebC template
    ${ styles ? `import "./index.css";` : "" }
    ${ types ? `type ${name}Props = ${types};` : "" }
    export const ${name} = (${params ?? ""}) => (
      <>
        ${sanitizeMarkup(snippet)}
      </>
    );

    export default ${name};
  `;
  
  return {
    component: boilerplate,
    styles,
    name,
  };
};

const toReactComponentFile = async ({ component, name, styles, outputDir}) => {
  const componentFileName = "index.tsx";
  const stylesFileName = "index.css";
  const componentDir = `./${outputDir}/components/${name}`;
  
  const componentDirUrl = new URL(componentDir, import.meta.url);
  await mkdir(componentDirUrl, { recursive: true });

  await writeFile(`${componentDir}/${componentFileName}`, component);

  if (styles) {
    await writeFile(`${componentDir}/${stylesFileName}`, styles);
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
    return name;
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
  
  let { html, css, js, components } = await page.compile(data ? { data } : undefined);

  // console.log("----HTML----");
  // console.log(html);
  // console.log("------------");

  // console.log("-----CSS----");
  // console.log(path);
  // console.log("------------");

  return {
    snippet: html,
    styles: css[0],
    name: getComponentName(path) ?? "Component",
    props,
  }
};

// const result = await compile("./components/component-with-props.webc", "./components/component-with-props.json");
const result = await compile("./components/hero.webc");

await toReactComponentFile({...toReactComponent(result), outputDir: "output", });

