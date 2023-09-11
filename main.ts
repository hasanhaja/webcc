import { WebC } from "webc";

type ToComponentOptions = {
  snippet: string;
  styles: string | undefined;
  name: string;
};

const sanitizeMarkup = (snippet: string): string => {
  let result = snippet;
  result = result.replaceAll("class=", "className=");
  return result;
};

const toReactComponent = ({ snippet, styles, name  }: ToComponentOptions) => {
  const boilerplate = `
    // This component was auto-generated from a WebC template

    import "./index.css";

    export const ${name} = () => (
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

type WriteToFileOptions = {
  component: string;
  name: string;
  styles: string | undefined;
  outputDir: string;
};

const toReactComponentFile = async ({ component, name, styles, outputDir}: WriteToFileOptions) => {
  const componentFileName = "index.tsx";
  const stylesFileName = "index.css";
  const componentDir = `./${outputDir}/components/${name}`;
  
  await Deno.mkdir(componentDir, { recursive: true }); 
  const encoder = new TextEncoder();
  const componentData = encoder.encode(component);
  await Deno.writeFile(`${componentDir}/${componentFileName}`, componentData);
  
  if (styles) {
    const stylesData = encoder.encode(styles);
    await Deno.writeFile(`${componentDir}/${stylesFileName}`, stylesData);
  }
};

const capitalize = (word: string): string => word[0].toUpperCase() + word.substr(1).toLowerCase();

const getComponentName = (path: string): string | undefined => {
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

const compile = async (path: string) => {
  let page = new WebC();

  // This enables aggregation of CSS and JS
  // As of 0.4.0+ this is disabled by default
  page.setBundlerMode(true);
  page.defineComponents("./components/**.webc");

  // File
  page.setInputPath(path);

  let { html, css, js, components } = await page.compile();

  // console.log("----HTML----");
  // console.log(html);
  // console.log("------------");

  // console.log("-----CSS----");
  // console.log(css);
  // console.log("------------");

  return {
    snippet: html,
    styles: css[0],
    name: getComponentName(components[0]) ?? "Component",
  }
};

const result = await compile("./components/hero.webc");

await toReactComponentFile({...toReactComponent(result), outputDir: "output", });

// console.log("-----CSS----");
// console.log(css);
// console.log("------------");

// console.log("-Components-");
// console.log(components);
// console.log("------------");

