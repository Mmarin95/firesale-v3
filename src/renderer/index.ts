import Elements from './elements';
import { renderMarkdown } from './markdown';

Elements.MarkdownView.addEventListener('input', async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
  const hasChanges = await window.api.checkForUnsavedChanges(markdown);
  Elements.SaveMarkdownButton.disabled = !hasChanges;
});

Elements.OpenFileButton.addEventListener('click', () => {
  window.api.showOpenDialog();
});

Elements.ExportHtmlButton.addEventListener('click', () => {
  const html = Elements.RenderedView.innerHTML;
  window.api.showExportHTMLDialog(html);
});

Elements.SaveMarkdownButton.addEventListener('click', () => {
  const content = Elements.MarkdownView.value;
  window.api.saveFile(content);
});
