
      if(typeof window !== "undefined" && ("customElements" in window)) {
        
  class MyGreeting extends HTMLElement {
    connectedCallback() {
      const p = this.querySelector("p");
      p.innerHTML = "Hello there";
    }
  }

  customElements.define("my-greeting", MyGreeting);

      }
    