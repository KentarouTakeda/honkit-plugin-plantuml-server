export const replaceCodeBlock = (markdown: string): string =>
  markdown.replaceAll(
    /```(?:uml|puml|plantuml)\s+([\s\S]*?)```/gim,
    (_, uml) => '{% uml %}' + '\n' + uml + '{% enduml %}',
  );

export const makeHtml = (data: ArrayBuffer, mime: string): string => {
  const url =
    'data:' + mime + ';base64,' + Buffer.from(data).toString('base64');
  const tag = '<figure>' + `<img src="${url}">` + '</figure>';

  return tag;
};
