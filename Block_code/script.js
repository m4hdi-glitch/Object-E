let ledIds = [];
let buttonIds = [];
let triggers = {};
const componentCounter = { button: 1, led: 1 };


// mobile friendy drag and drop
const paletteItems = document.querySelectorAll('.draggable');
const designArea = document.getElementById('designArea');

paletteItems.forEach((item) => {
  // Desktop drag
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', item.dataset.type);
  });

  // Mobile touch fallback
  item.addEventListener('touchstart', (e) => {
    const type = item.dataset.type;
    const touch = e.touches[0];
    const ghost = createUIElement(type);

    ghost.style.position = 'absolute';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.7';
    ghost.style.zIndex = 1000;
    ghost.style.left = touch.pageX + 'px';
    ghost.style.top = touch.pageY + 'px';
    document.body.appendChild(ghost);

    const move = (e) => {
      const touch = e.touches[0];
      ghost.style.left = touch.pageX + 'px';
      ghost.style.top = touch.pageY + 'px';
    };

    const end = (e) => {
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);

      if (designArea.contains(target)) {
        const finalEl = createUIElement(type);
        finalEl.style.margin = '10px';
        designArea.appendChild(finalEl);
      }

      ghost.remove();
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
    };

    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end, { passive: false });
  });
});

// Desktop drop support
function handleDrop(event) {
  event.preventDefault();
  const type = event.dataTransfer.getData('type');
  if (!type) return;
  const el = createUIElement(type);
  el.style.margin = '10px';
  designArea.appendChild(el);
}

function createUIElement(type) {
  let el;
  switch (type) {
    case 'button':
      el = document.createElement('button');
      el.textContent = 'Button';
      break;
    case 'led':
      el = document.createElement('div');
      el.textContent = 'LED';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.background = 'red';
      break;
    default:
      el = document.createElement('div');
      el.textContent = type;
  }
  return el;
}


function defineBlocks() {
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "delay",
      "message0": "Wait %1 ms",
      "args0": [{ "type": "field_number", "name": "TIME", "value": 500, "min": 0 }],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 65
    },
    {
      "type": "controls_repeat_ext",
      "message0": "repeat %1 times %2",
      "args0": [
        { "type": "input_value", "name": "TIMES", "check": "Number" },
        { "type": "input_statement", "name": "DO" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 120
    }
  ]);

  Blockly.Blocks['led_on'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Turn ON")
        .appendField(new Blockly.FieldDropdown(() =>
          ledIds.length ? ledIds.map(id => [id, id]) : [["None", "None"]]
        ), "LED_ID");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['led_off'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Turn OFF")
        .appendField(new Blockly.FieldDropdown(() =>
          ledIds.length ? ledIds.map(id => [id, id]) : [["None", "None"]]
        ), "LED_ID");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(160);
    }
  };

  Blockly.Blocks['on_button_click'] = {
    init: function () {
      this.appendDummyInput()
        .appendField("When")
        .appendField(new Blockly.FieldDropdown(() =>
          buttonIds.length ? buttonIds.map(id => [id, id]) : [["None", "None"]]
        ), "BUTTON_ID")
        .appendField("clicked");
      this.appendStatementInput("DO")
        .setCheck(null)
        .appendField("do");
      this.setColour(20);
    }
  };
}

defineBlocks();

const workspace = Blockly.inject('blocklyDiv', {
  toolbox: document.getElementById('toolbox'),
  scrollbars: true
});

function refreshDropdowns() {
  const xml = Blockly.Xml.workspaceToDom(workspace);
  Blockly.Events.disable();
  workspace.clear();
  defineBlocks();
  Blockly.Xml.domToWorkspace(xml, workspace);
  Blockly.Events.enable();
}

document.querySelectorAll('.draggable').forEach(elem => {
  elem.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('type', e.target.getAttribute('data-type'));
  });
});

function handleDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('type');
  const designArea = document.getElementById('designArea');

  if (type === 'button') {
    const id = `Button${componentCounter.button++}`;
    const btn = document.createElement('button');
    btn.textContent = id;
    btn.className = 'component';
    btn.id = id;
    btn.onclick = () => triggerButton(id);
    designArea.appendChild(btn);
    buttonIds.push(id);
  }

  if (type === 'led') {
    const id = `LED${componentCounter.led++}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'component';
    wrapper.id = id + '_wrapper';

    const led = document.createElement('div');
    led.className = 'led';
    led.id = id;

    const label = document.createElement('span');
    label.textContent = id;

    wrapper.appendChild(led);
    wrapper.appendChild(label);
    designArea.appendChild(wrapper);
    ledIds.push(id);
  }

  refreshDropdowns();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBlockChain(block) {
  let current = block;
  while (current) {
    switch (current.type) {
      case 'led_on': {
        const id = current.getFieldValue('LED_ID');
        if (id !== 'None') {
          const el = document.getElementById(id);
          if (el) el.style.backgroundColor = 'red';
        }
        break;
      }
      case 'led_off': {
        const id = current.getFieldValue('LED_ID');
        if (id !== 'None') {
          const el = document.getElementById(id);
          if (el) el.style.backgroundColor = 'gray';
        }
        break;
      }
      case 'delay': {
        const ms = Number(current.getFieldValue('TIME'));
        await sleep(ms);
        break;
      }
      case 'controls_repeat_ext': {
        let times = 1;
        const timesBlock = current.getInputTargetBlock('TIMES');
        if (timesBlock && timesBlock.type === 'math_number') {
          times = Number(timesBlock.getFieldValue('NUM'));
        }
        const doBlock = current.getInputTargetBlock('DO');
        for (let i = 0; i < times; i++) {
          if (doBlock) await runBlockChain(doBlock);
        }
        break;
      }
      default:
        break;
    }
    current = current.getNextBlock();
  }
}

function loadTriggers() {
  triggers = {};
  const topBlocks = workspace.getTopBlocks(true);

  topBlocks.forEach(block => {
    if (block.type === 'on_button_click') {
      const btnId = block.getFieldValue('BUTTON_ID');
      if (!triggers[btnId]) triggers[btnId] = [];
      const doBlock = block.getInputTargetBlock('DO');
      if (doBlock) triggers[btnId].push(doBlock);

    }
  });

}


function triggerButton(id) {
  if (triggers[id]) {
    triggers[id].forEach(async (doBlock) => {
      await runBlockChain(doBlock);
    });
  }
}

document.getElementById('loadLogicBtn').addEventListener('click', loadTriggers);

