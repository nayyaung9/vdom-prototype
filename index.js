/** @jsx h */

function h(type, props, ...children) {
  return { type, props, children };
}

const a = (
  <ul class="list">
    <li>item 1</li>
    <li>item 2</li>
  </ul>
);

console.log(a);