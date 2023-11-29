import Elements from './elements';
import { renderMarkdown } from './markdown';

Elements.MarkdownView.addEventListener('input', async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
});

Elements.OpenFileButton.addEventListener('click', () => {
  window.api.showOpenDialog();
});
