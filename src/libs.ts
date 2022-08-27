export const replaceCodeBlock = (markdown: string): string =>
  markdown.replace(
    /```(?:uml|puml|plantuml)\s+([\s\S]*?)```/gim,
    (_, uml) => '{% uml %}' + '\n' + uml + '{% enduml %}',
  );

export const makeHtml = (
  data: ArrayBuffer,
  mime: string,
  cssClass: string | null,
): string => {
  const url =
    'data:' + mime + ';base64,' + Buffer.from(data).toString('base64');
  const tag =
    `<figure class="${cssClass}">` + `<img src="${url}">` + '</figure>';

  return tag;
};
