class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      const eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase());
      this.root.addEventListener(eventName, value);
    } else if (name === "className") {
      this.root.setAttribute("class", value);
    } else {
      this.root.setAttribute(name, value);
    }
  }
  appendChild(vChild) {
    const range = document.createRange();
    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vChild.mountTo(range);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }
  mountTo(range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
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
    const placeholder = document.createComment("placeholder");
    const range = document.createRange();
    range.setStart(this.range.endContainer, this.range.endOffset);
    range.setEnd(this.range.endContainer, this.range.endOffset);
    range.insertNode(placeholder);
    this.range.deleteContents();
    const element = this.render();
    element.mountTo(this.range);
    // placeholder.parentNode.removeChild(placeholder);
  }
  appendChild(vChild) {
    this.children.push(vChild);
  }
  setState(state) {
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === "object") {
          if (typeof oldState[p] !== "object") {
            oldState[p] = {};
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
