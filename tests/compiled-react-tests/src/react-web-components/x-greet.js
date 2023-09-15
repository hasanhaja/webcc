if(typeof window !== "undefined" && ("customElements" in window)) {
  console.log("Component script loading");

  class XGreet extends HTMLElement {
    connectedCallback() {
      // console.log(import.meta.env);
      const p = this.querySelector("p");
      p.innerHTML = "Hello as web component";
    }
  };

  customElements.define("x-greet", XGreet);
}
