import React, { useLayoutEffect, useState } from "react";
import "./App.css";
import rough from "roughjs";
import { v4 as uuidv4 } from "uuid";

const generator = rough.generator();

function createElement(id, x1, y1, x2, y2, type) {
  let roughElement = null;
  if (type === "line") {
    roughElement = generator.line(x1, y1, x2, y2);
  }
  if (type === "rectangle") {
    roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
  }
  return { id, x1, y1, x2, y2, type, roughElement };
}

function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function isWithinElement(x, y, element) {
  const { type, x1, x2, y1, y2 } = element;
  if (type === "rectangle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } else {
    const a = { x: x1, y: y1 };
    const b = { x: x2, y: y2 };
    const c = { x, y };

    const offset = distance(a, b) - (distance(a, c) + distance(b, c));

    return Math.abs(offset) < 1;
  }
}

function getElementAtPosition(x, y, elements) {
  return elements.find((element) => isWithinElement(x, y, element));
}

function App() {
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("line");
  const [selectedElement, setSelectedElement] = useState(null);
  const [currentElement, setCurrentElement] = useState(null); //!Own Code

  useLayoutEffect(() => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const roughCanvas = rough.canvas(canvas);
    elements.forEach(({ roughElement }) => {
      roughCanvas.draw(roughElement);
    });
  }, [elements]);

  const updateElement = (id, x1, y1, clientX, clientY, type) => {
    const updatedElement = createElement(id, x1, y1, clientX, clientY, type);
    const elementsCopy = [...elements];
    const indexOfOldElement = elementsCopy.findIndex((el) => el.id === id);
    elementsCopy[indexOfOldElement] = updatedElement;
    setElements(elementsCopy);
  };

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      const element = getElementAtPosition(clientX, clientY, elements); //if we are on element

      if (element) {
        setCurrentElement(element);
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;
        setSelectedElement({ ...element, offsetX, offsetY });
        setAction("moving");
      }
    } else {
      setAction("drawing");
      const { clientX, clientY } = event;
      const id = uuidv4();
      const element = createElement(
        id,
        clientX,
        clientY,
        clientX,
        clientY,
        tool
      );
      setCurrentElement(element);
      setElements((prevState) => [...prevState, element]);
    }
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = event;
    if (tool === "selection") {
      event.target.style.cursor = getElementAtPosition(
        clientX,
        clientY,
        elements
      )
        ? "move"
        : "default";
    }

    if (action === "drawing") {
      const index = elements.length - 1;
      //const { id, x1, y1 } = elements[index];
      const { id, x1, y1 } = currentElement;
      updateElement(id, x1, y1, clientX, clientY, tool);
    } else if (action === "moving") {
      const { id, x1, y1, x2, y2, type, offsetX, offsetY } = selectedElement;
      const width = x2 - x1;
      const height = y2 - y1;
      const newX1 = clientX - offsetX;
      const newY1 = clientY - offsetY;
      updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type);
    }
  };

  const adjustElementCoordinates = () => {};

  const handleMouseUp = (event) => {
    // if (action == "drawing") {
    //   const { x1, y1, x2, y2 } = adjustElementCoordinates();
    // }

    setAction("none");
    setSelectedElement(null);
  };

  return (
    <div style={{ position: "fixed" }}>
      <input
        type="radio"
        id="selection"
        checked={tool === "selection"}
        onChange={() => setTool("selection")}
      />
      <label htmlFor="selection">Selection</label>

      <input
        type="radio"
        id="line"
        checked={tool === "line"}
        onChange={() => setTool("line")}
      />
      <label htmlFor="line">Line</label>

      <input
        type="radio"
        id="rectangle"
        checked={tool === "rectangle"}
        onChange={() => setTool("rectangle")}
      />
      <label htmlFor="rectangle">Rectangle</label>

      <canvas
        id="canvas"
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      ></canvas>
    </div>
  );
}

export default App;
