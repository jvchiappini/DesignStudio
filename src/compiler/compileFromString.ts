import React from "react";
import { primitiveRegistry } from "./registry";

const REACT_IMPORT = `
  const React = arguments[0];
  const { Fragment } = React;
`;

export function compileFromString(code: string): React.ReactElement | null {
  const wrapped = code.trim();
  if (!wrapped.startsWith("<")) return null;

  const keys = Object.keys(primitiveRegistry);
  const registryKeys = keys.join(",");

  const fnBody = `
    ${REACT_IMPORT}
    const { ${registryKeys} } = arguments[1];
    return (${wrapped});
  `;

  try {
    const factory = new Function(fnBody);
    const element = factory(React, primitiveRegistry) as React.ReactElement;
    return element;
  } catch {
    console.warn("[Compiler] Error compilando JSX desde string");
    return null;
  }
}
