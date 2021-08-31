## Implementing VDOM in burmese

ဒီ repo မှာ ကိုယ်ပိုင် vdom တစ်ခု implement လုပ်ကြည့်မယ်။
JSX ကနေ ကိုယ်ပိုင် helper function တစ်ခုနဲ့ vdom ထုတ်ကြမယ်။

```html
<ul class="list">
  <li>item 1</li>
  <li>item 2</li>
</ul>
```

```js
{ type: "ul", props: { "class": "list" }, children: [
  { type: "li", props: {}, children: ["item 1"] },
  { type: "li", props: {}, children: ["item 2"] }
] }
```

Vdom ဆိုတာက DOM tree တွေကို object အနေနဲ့ ထုတ်ပေးတယ်။ သူ့မှာ type, props နဲ့ children ဆိုပြီး ရှိမယ်။ တကယ့် React Source ထဲမှာတော့ တစ်ခြား property တွေပါတာပေါ့၊ ( ref တို $$typeof ) တို့ပေါ့။ အဲ့ဒါတွေကိုဘယ်မှာသိမ်းလဲဆိုတော့ Component render မလုပ်ခင် memory တစ်ခုပေါ်သိမ်းထားတယ်။ နောက် Component မှာ state တစ်ခုခုပြောင်းသွားရင် Vdom အသစ်ပြန်ထွက်လာမယ်။ ဆိုတော့ ခုနက ရှိတဲ့ old vdom ( kept in memory ) နဲ့ အသစ် Vdom ၂ခုကိုတိုက်စစ်တယ်၊ ဒါကို DOM diffing ဒါမှမဟုတ် Reconciliation Algorithm လိုခေါ်တယ်။ create-your-own-react-burmese repo ထဲမှာ React Fiber အကြောင်းရေးထားပါတယ်။

> အခု‌ကတော့ Recursive Call တွေနဲ့ ခေါ်ရေးထားရတယ်။ @cyorb မှာတော့ priority based နဲ့ Fiber architecture ထဲမှာ implementing လုပ်ပြထားတယ်။

```js
function createElement(node) {
  if (typeof node === "string") {
    return document.createTextNode(node);
  }

  const $el = document.createElement(node.type);

  node.children.map(createElement).forEach($el.appendChild.bind($el));

  return $el;
}
```

ပထမဆုံး createElement function တစ်ခု ရေးမယ်။ သူက virtual DOM ကနေ Real DOM ပြန်ထုတ်ပေးမယ်။ အခုကတော့ props နဲ့ children ကိုခဏ မေ့ထားပေးပါ။

node parameter ထဲကနေ HTML tag လာနိုင်သလို string text လည်းလာနိုင်တယ်။ ကုတ်ကတော့ အသေးစိတ်ရှင်းပြစရာမလိုဘူးထင်ပါတယ်။

နောက်တစ်ဆင့်မှာ node ထဲက type property ကိုသုံးပြီး DOM element တစ်ခု create လုပ်မယ်။ နောက်သူ့ထဲက ပါမယ့် children တွေကို ခုနကလို createElement ထဲထည့်ပြီး parent node ထဲပြန်ထည့်ပေးလိုက်မယ်။

## Changes တွေကို handling လုပ်မယ်။

အခုကျွန်တော်တိုက virtual dom tree 2 ခုကို diffing လုပ်တော့မယ်။ ဘယ်လိုလုပ်မလဲ?

### There is no old node

```html
<!--new-->
<ul>
  <li>item 1</li>
  <li>item 2</li>
</ul>

<!--old-->
<ul>
  <li>item 1</li>
</ul>
```

အပေါ်က example ကိုကြည့်ရင် new vdom ထဲမှာ အသစ် li tag တစ်ခု၀င်လာတယ်၊ ဒါဆို ကျွန်တော်တိုက appendChild လုပ်ပြီး ထည့်ပေးရမယ်။

```js
if (!oldNode) {
  $parent.appendChild(createElement(newNode));
}
```

---

### There is no new node

```html
<!--new-->
<ul>
  <li>item 1</li>
</ul>

<!--old-->
<ul>
  <li>item 1</li>
  <li>item 2</li>
</ul>
```

ဒီမှာဆို new node ထဲမှာ li tag တစ်ခုပျောက်သွားပြီဆိုရင် ကျွန်တော်တိုက removeChild ကိုသုံးပြီး real DOM ထဲက ဖယ်ပေးရမယ်။

ဒါပေမယ့် ဖယ်ဆိုတိုင်း ကျွန်တော်တိုက ကောက်ဖယ်လိုမရဘူး။ real DOM ထဲက reference ကို pass လုပ်ပေးရမယ်၊ ဒါမှ node ရဲ့ position ကိုသိပြီးဖယ်ထုတ်လိုရမှာ

```js
if (!newNode) {
  $parent.removeChild($parent.childNodes[index]);
}
```

---

## Node changed

nodes ၂ခုကို compare လုပ်ဖို function တစ်ခုရေးမယ်။ သူကဘာလုပ်တာလဲဆိုတော့ ဘယ် node tag တွေပြောင်းသွားလဲဆိုတာကြည့်မယ်၊ ပြီးရင် သူရဲ့ tag type ကိုကြည့်မယ်။
တစ်ခုရှိတာသည် အဲ့ထဲက elements လည်းဖြစ်နိုင်တယ် text node တွေလည်းဖြစ်နိုင်တယ်။

```js
function changed(node1, node2) {
 return typeof node1 !== typeof node2 ||
        typeof node1 === ‘string’ && node1 !== node2 ||
        node1.type !== node2.type
}

```

သူက ဘယ်လိုလဲဆိုတာ ဒီဥပမာကိုကြည့်ကြည့်ပါ

```html
<!--example-->
<!--new-->

<div>
  <p>Hi There!</p>
  <p>Hello</p>
</div>

<div>
  <p>Hi There!</p>
  <button>click it</button>
</div>
```

```js
else if (changed(newNode, oldNode)) {
    $parent.replaceChild(
      createElement(newNode),
      $parent.childNodes[index]
    );
  }
```

---

ဒီအဆင့်တွေပြီးသွားရင် ကျွန်တော်တိုက nodes children တွေထိ ဆက်ကြည့်သွားရမယ်။

```js
else if (newNode.type) {
    const newLength = newNode.children.length;
    const oldLength = oldNode.children.length;
    for (let i = 0; i < newLength || i < oldLength; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      );
    }
  }
```

### References

https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060
https://pomb.us/build-your-own-react/