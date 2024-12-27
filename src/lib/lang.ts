import ts from "typescript";

export async function ts2js(code:string){
  return ts.transpile(code, {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    // add source map
    sourceMap: true,
    inlineSourceMap: true,
    inlineSources: true,
  });
}

export async function ts2Module(code: string){
  const jsCode = await ts2js(code);

  const blob = new Blob([jsCode], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);

  const module = await import(url);

  URL.revokeObjectURL(url);

  return module;
}