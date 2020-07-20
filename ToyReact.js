class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(vChild) {
    vChild.mountTo(this.root);
  }
  mountTo(container) {
    container.appendChild(this.root);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }
  mountTo(container) {
    container.appendChild(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
  }
  setAttribute(name, value) {
    this[name] = value;
  }
  mountTo(container) {
    const element = this.render();
    element.mountTo(container);
  }
  appendChild(vChild) {
    this.children.push(vChild);
  }
}

export const ToyReact = {
  createElement(type, attributes, ...children) {
    let element;
    if (typeof type === "string") {
      element = new ElementWrapper(type);
    } else {
      element = new type();
    }

    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }
    const insertChildren = (_children) => {
      for (let child of _children) {
        if (typeof child === "object" && Array.isArray(child)) {
          insertChildren(child);
        } else {
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child);
          }
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }
          element.appendChild(child);
        }
      }
    };
    insertChildren(children);
    return element;
  },

  render(element, container) {
    element.mountTo(container);
  },
};
