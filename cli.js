#! /usr/bin/env node 

import { Command } from "commander";
import { reactify, compile, toReactComponent, toAstroComponent, astrofy } from "./main.js";

const program = new Command();

program
  .name("webcc")
  .description("CLI to compile WebC components to framework components")
  .version('0.0.1');

program
  .command("compile")
  .description("Compile WebC components to React components")
  .argument("<framework>", "Target framework to compile the WebC component to")
  .option("-s, --source <filename>", "Path to the WebC component to be compiled")
  .option("-o, --output <directory>", "Path to the output directory to write files to")
  .option("-p, --props <filename>", "Path to the components props JSON schema file")
  .option("-d, --debug", "Debugging option dry runs the compilation without writing to output")
  .action(async (str, options) => {
    const { source, output, debug: isDebug, props } = options;
    
    if (str.toLowerCase() === "react") {
      if (isDebug) {
        console.log(`💡 Debugging [${source}]`);

        const result = await compile(source, props);
        const { snippet, js, styles } = result;
        console.log("----HTML----");
        console.log(snippet);

        console.log("-----JS-----");
        console.log(js !== "" ? js : "No JavaScript");
        
        console.log("----CSS-----");
        console.log(styles !== "" ? styles : "No CSS");

        const { component } = toReactComponent(result);
        
        console.log("---REACT----");
        console.log(component);
        console.log("------------");

        return;
      }

      // TODO Throw error if output is not defined

      console.log("🚀 Compiling WebC to React..."); 
      await reactify(source, output, props);
      console.log("✅ WebC to React compilation successful!"); 
    } else if (str.toLowerCase() === "astro") {
      if (isDebug) {
        console.log(`💡 Debugging [${source}]`);

        const result = await compile(source, props);
        const { snippet, js, styles } = result;
        console.log("----HTML----");
        console.log(snippet);

        console.log("-----JS-----");
        console.log(js !== "" ? js : "No JavaScript");
        
        console.log("----CSS-----");
        console.log(styles !== "" ? styles : "No CSS");

        const { component } = toAstroComponent(result);
        
        console.log("---ASTRO----");
        console.log(component);
        console.log("------------");

        return;
      }

      // TODO Throw error if output is not defined

      console.log("🚀 Compiling WebC to Astro..."); 
      await astrofy(source, output, props);
      console.log("✅ WebC to Astro compilation successful!"); 
    } else {
      console.error("🙁 Sorry, wcc currently only supports the following targets:\n- React\n- Astro");
    }
  });

// TODO Add flag for props file

program.parse();
