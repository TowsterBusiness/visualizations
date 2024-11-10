import React, { useEffect, useState } from "react";

let isMouseDown = false;
let dragPoints: Array<number[]>;
let dragStartTime: number = 0;

function FourierTransform() {
  const [path, setPath] = useState([[0, 0]]);
  let canvasRef: React.RefObject<HTMLCanvasElement> =
    React.createRef<HTMLCanvasElement>();

  const constantNumber: number = 100;
  const dt: number = 0.001;

  let drawingPath: Array<number[]> = [];

  useEffect(() => {
    const canvas = canvasRef.current;

    const constants: Array<number[]> = [];
    for (let i = 0; i < constantNumber; i++) {
      if (i % 2 == 1) {
        constants.push(constantGen(dt, Math.floor((i + 1) / 2), path));
      } else if (i % 2 == 0) {
        constants.push(constantGen(dt, -Math.floor((i + 1) / 2), path));
      }
    }

    const animate = () => {
      if (canvas == null) return;

      const context = canvas.getContext("2d");

      canvas.width = 400;
      canvas.height = 400;

      if (context) {
        let t = Date.now() / 3000;
        context.fillStyle = "#1c1c1c";
        context.fillRect(0, 0, 400, 400);

        context.fillStyle = "#ffffff";
        let points: number[] = getPath(t, path);
        context.fillRect(points[0], points[1], 10, 10);

        context.fillStyle = "#46eb34";
        context.fillRect(constants[0][0], constants[0][1], 10, 10);

        for (let drawingPoint of drawingPath) {
          context.fillStyle = "#fc0356";
          context.fillRect(drawingPoint[0], drawingPoint[1], 5, 5);
        }

        let vecNext = [0, 0];
        let vecList = [];
        for (let i = 0; i < constantNumber; i++) {
          let constant = 0;
          if (i % 2 == 0) {
            constant = -Math.floor((i + 1) / 2);
          } else if (i % 2 == 1) {
            constant = Math.floor((i + 1) / 2);
          }

          let vec2 = rotate(constants[i], constant * t * 2 * Math.PI);

          vecNext = addVector2d(vec2, vecNext);
          vecList.push(vecNext);
        }

        for (let i = 0; i < vecList.length; i++) {
          context.strokeStyle = "#ffffff";

          if (i != vecList.length - 1) {
            context.beginPath();
            context.moveTo(vecList[i][0] + 5, vecList[i][1] + 5);
            context.lineTo(vecList[i + 1][0] + 5, vecList[i + 1][1] + 5);
            context.lineWidth = 2;
            context.stroke();
          }

          context.fillStyle = "#46eb34";
          context.fillRect(vecList[i][0], vecList[i][1], 10, 10);
        }

        drawingPath.push(vecNext);
        if (drawingPath.length > 40) {
          drawingPath.splice(0, 1);
        }
      }

      requestAnimationFrame(animate);
    };
    animate();
  });

  const mouseMoveHandler = (evt: any) => {
    if (isMouseDown) {
      const x = evt.nativeEvent.offsetX;
      const y = evt.nativeEvent.offsetY;
      const t = Date.now() - dragStartTime;

      dragPoints.push([x, y, t]);
    }
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={(evt) => {
          dragPoints = [];
          dragStartTime = Date.now();
          isMouseDown = true;
        }}
        onMouseUp={() => {
          setPath(dragPoints);
          isMouseDown = false;
        }}
        onMouseMove={mouseMoveHandler}
      />
    </div>
  );
}

function constantGen(dt: number, term: number, path: number[][]) {
  const vec: number[] = integral2d(dt, (t: number) => {
    let pointPolar = getPath(t, path);
    pointPolar = polarize(pointPolar[0], pointPolar[1]);

    pointPolar[1] = pointPolar[1] - term * t * 2 * Math.PI;

    return vectorize(pointPolar[0], pointPolar[1]);
  });
  return vec;
}

function integral2d(
  dt: number,
  fun: (t: number) => number[],
  begin: number = 0,
  end: number = 1
) {
  let inc: number = begin;
  let fin: number[] = [0, 0];
  while (inc < end) {
    const out: number[] = fun(inc);
    fin[0] += out[0] * dt;
    fin[1] += out[1] * dt;
    inc += dt;
  }
  return fin;
}

function getPath(t: number, path: number[][]): number[] {
  t %= 1;
  if (path.length <= 1) return trianglePoints(t);
  //TODO Add binary search
  let index = -1;
  let timeInPath = t * path[path.length - 1][2];
  path.forEach((point, i) => {
    if (timeInPath < point[2] && index == -1) {
      index = i - 1;
    }
  });

  const percent =
    (timeInPath - path[index][2]) / (path[index + 1][2] - path[index][2]);
  const deltaX = (path[index + 1][0] - path[index][0]) * percent;
  const deltaY = (path[index + 1][1] - path[index][1]) * percent;

  return [path[index][0] + deltaX, path[index][1] + deltaY];
}

function trianglePoints(t: number): number[] {
  // time expected 0 -> 1

  let x: number;
  let y: number;

  // x = Math.cos(toRadians(t * 360)) * 50;
  // y = Math.sin(toRadians(t * 360)) * 50;
  if (t < 1 / 3) {
    t -= 0;
    t *= 3;

    x = 0 + t * 100;
    y = 100 + t * -200;
  } else if (t < 2 / 3) {
    t -= 1 / 3;
    t *= 3;

    x = 100 + t * -200;
    y = -100;
  } else {
    t -= 2 / 3;
    t *= 3;

    x = -100 + t * 100;
    y = -100 + t * 200;
  }
  return [x + 200, y * -1 + 200];
}

function vectorize(m: number, theta: number): number[] {
  return [Math.cos(theta) * m, Math.sin(theta) * m];
}

function polarize(x: number, y: number) {
  return [distance(x, y), Math.atan2(y, x)];
}

function rotate(a: number[], theta: number): number[] {
  return [
    a[0] * Math.cos(theta) - a[1] * Math.sin(theta),
    a[0] * Math.sin(theta) + a[1] * Math.cos(theta),
  ];
}

function toRadians(a: number): number {
  return a * (Math.PI / 180);
}

function toDegrees(a: number): number {
  return a * (180 / Math.PI);
}

function distance(a: number, b: number): number {
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

function normalize2d(a: number[]): number[] {
  let vector = [a[0], a[1]];
  let length = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
  vector[0] /= length;
  vector[1] /= length;
  return vector;
}

function addVector2d(a: number[], b: number[]) {
  return [a[0] + b[0], a[1] + b[1]];
}

function subtractVector2d(a: number[], b: number[]) {
  return [a[0] - b[0], a[1] - b[1]];
}

function multiplyVector2d(a: number[], s: number) {
  return [a[0] * s, a[1] * s];
}

export default FourierTransform;
