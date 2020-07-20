import { ToyReact, Component } from "./ToyReact";

class MyComponent extends Component {
  render() {
    return <div>Awesome ! {this.children}</div>;
  }
}

const div = (
  <MyComponent name="a" id="a">
    <span>Hello</span>
    <span> World</span>
    <span> !</span>
  </MyComponent>
);

ToyReact.render(div, document.getElementById("root"));
