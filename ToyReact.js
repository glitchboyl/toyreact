const CHILDREN = Symbol("children");

class ElementWrapper {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this[CHILDREN] = [];
    this.children = [];
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(vChild) {
    this[CHILDREN].push(vChild);
    this.children.push(vChild.vDom);
  }
  get vDom() {
    return this;
  }
  mountTo(range) {
    this.range = range;
    const placeholder = document.createComment('placeholder');
    const endRange = document.createRange();
    endRange.setStart(range.endContainer, range.endOffset);
    endRange.setEnd(range.endContainer, range.endOffset);
    endRange.insertNode(placeholder);

    range.deleteContents();
    const element = document.createElement(this.type);

    for (let name in this.props) {
      const value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        const eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase());
        element.addEventListener(eventName, value);
      } else if (name === "className") {
        element.setAttribute("class", value);
      } else {
        element.setAttribute(name, value);
      }
    }

    for (let child of this.children) {
      const range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }

    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
    this.type = "#text";
    this.props = Object.create(null);
    this.children = [];
  }
  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
  get vDom() {
    return this;
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
  }
  get type() {
    return this.constructor.name;
  }
  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }
  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    const vDom = this.vDom;
    if (this.oldVDom) {
      const isSameNode = (node, _node) => {
        if (node.type !== _node.type) {
          return false;
        }

        for (let name in node.props) {
          // if (
          //   typeof node.props[name] === "function" &&
          //   typeof _node.props[name] === "function" &&
          //   node.props[name].toString() === _node.props[name].toString()
          // ) {
          //   continue;
          // }
          if (
            typeof node.props[name] === "object" &&
            typeof _node.props[name] === "object" &&
            JSON.stringify(node.props[name]) ===
              JSON.stringify(_node.props[name])
          ) {
            continue;
          }
          if (node.props[name] !== _node.props[name]) {
            return false;
          }
        }

        if (
          Object.keys(node.props).length !== Object.keys(_node.props).length
        ) {
          return false;
        }

        return true;
      };

      const isSameTree = (node, _node) => {
        if (!isSameNode(node, _node)) {
          return false;
        }

        if (node.children.length !== _node.children.length) {
          return false;
        }

        for (let i = 0; i < node.children.length; i++) {
          if (!isSameTree(node.children[i], _node.children[i])) {
            return false;
          }
        }

        return true;
      };

      const replace = (newTree, oldTree) => {
        if (isSameTree(newTree, oldTree)) {
          return;
        }

        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range);
        } else {
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i]);
          }
        }
      };

      replace(vDom, this.oldVDom);
    } else {
      vDom.mountTo(this.range);
    }
    this.oldVDom = vDom;
  }
  get vDom() {
    return this.render().vDom;
  }
  appendChild(vChild) {
    this.children.push(vChild);
  }
  setState(state) {
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === "object" && newState[p] !== null) {
          if (typeof oldState[p] !== "object") {
            if (Array.isArray(newState[p])) {
              oldState[p] = [];
            } else {
              oldState[p] = {};
            }
          }
          merge(oldState[p], newState[p]);
        } else {
          oldState[p] = newState[p];
        }
      }
    };
    if (!this.state && state) {
      this.state = Object.create(null);
    }
    merge(this.state, state);
    this.update();
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
          if (child === null || child === void 0) {
            child = "";
          }
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
    const range = document.createRange();
    if (container.children.length) {
      range.setStartAfter(container.lastChild);
      range.setEndAfter(container.lastChild);
    } else {
      range.setStart(container, 0);
      range.setEnd(container, 0);
    }
    element.mountTo(range);
  },
};

// const EventListener = {
//   listen(target, eventType, callback) {
//     if (target.addEventListener) {
//       target.addEventListener(eventType, callback, false);
//       return {
//         remove() {
//           target.removeEventListener(eventType, callback, false);
//         },
//       };
//     } else if (target.attachEvent) {
//       target.attachEvent("on" + eventType, callback);
//       return {
//         remove() {
//           target.detachEvent("on" + eventType, callback);
//         },
//       };
//     }
//   },
// };
// const eventTypes = [
//   "abort",
//   "animationEnd",
//   "animationIteration",
//   "animationStart",
//   "blur",
//   "cancel",
//   "canPlay",
//   "canPlayThrough",
//   "click",
//   "close",
//   "contextMenu",
//   "copy",
//   "cut",
//   "doubleClick",
//   "drag",
//   "dragEnd",
//   "dragEnter",
//   "dragExit",
//   "dragLeave",
//   "dragOver",
//   "dragStart",
//   "drop",
//   "durationChange",
//   "emptied",
//   "encrypted",
//   "ended",
//   "error",
//   "focus",
//   "input",
//   "invalid",
//   "keyDown",
//   "keyPress",
//   "keyUp",
//   "load",
//   "loadedData",
//   "loadedMetadata",
//   "loadStart",
//   "mouseDown",
//   "mouseMove",
//   "mouseOut",
//   "mouseOver",
//   "mouseUp",
//   "paste",
//   "pause",
//   "play",
//   "playing",
//   "progress",
//   "rateChange",
//   "reset",
//   "scroll",
//   "seeked",
//   "seeking",
//   "stalled",
//   "submit",
//   "suspend",
//   "timeUpdate",
//   "toggle",
//   "touchCancel",
//   "touchEnd",
//   "touchMove",
//   "touchStart",
//   "transitionEnd",
//   "volumeChange",
//   "waiting",
//   "wheel",
// ].map((event) => {
//   return "on" + event[0].toUpperCase() + event.slice(1);
// });
// function getEventBaseName(eventName) {
//   if (eventTypes.includes(eventName)) {
//     const eventBaseName = eventName[2].toLowerCase() + eventName.slice(3);
//     return eventBaseName;
//   }
//   return null;
// }
// const eventName = getEventBaseName(name);
