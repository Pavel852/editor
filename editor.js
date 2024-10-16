(function() {
  // Objekt pro uložení jazykových řetězců
  var lang = {};

  // Funkce pro načtení souboru lang.ini
  function loadLanguageFile(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './lang.ini', true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var text = xhr.responseText;
          var lines = text.split('\n');
          lines.forEach(function(line) {
            line = line.trim();
            if (line && line.indexOf('=') > -1 && line.charAt(0) !== ';') {
              var parts = line.split('=');
              var key = parts[0].trim();
              var value = parts.slice(1).join('=').trim();
              lang[key] = value;
            }
          });
        } else {
          console.error('Chyba při načítání lang.ini');
        }
        callback();
      }
    };
    xhr.send();
  }

  // Inicializace editoru po načtení DOM a lang.ini
  document.addEventListener('DOMContentLoaded', function() {
    loadLanguageFile(function() {
      // Získání typu zdroje (html nebo wiki)
      var scripts = document.getElementsByTagName('script');
      var currentScript = scripts[scripts.length - 1];
      var sourceType = currentScript.getAttribute('source') || 'html';

      var textarea = document.getElementById('editor');
      if (!textarea) {
        console.error('Textarea s id "editor" nebyla nalezena.');
        return;
      }

      // Skrytí textarea a vytvoření contentEditable divu
      textarea.style.display = 'none';
      var editorDiv = document.createElement('div');
      editorDiv.id = 'wysiwyg-editor';
      editorDiv.contentEditable = true;
      editorDiv.style.minHeight = '300px';
      editorDiv.style.border = '1px solid #ccc';
      editorDiv.style.padding = '5px';
      editorDiv.style.boxSizing = 'border-box';
      editorDiv.style.width = '100%';
      editorDiv.style.whiteSpace = 'pre-wrap';
      textarea.parentNode.insertBefore(editorDiv, textarea);

      // Nastavení stejného stylu pro textarea
      textarea.style.minHeight = '300px';
      textarea.style.border = '1px solid #ccc';
      textarea.style.padding = '5px';
      textarea.style.boxSizing = 'border-box';
      textarea.style.width = '100%';
      textarea.style.whiteSpace = 'pre-wrap';

      // Určení, zda je aktivní WIKI režim
      var isWikiMode = sourceType === 'wiki';

      // Inicializace obsahu editoru
      if (isWikiMode) {
        editorDiv.innerHTML = convertWikiToHTML(textarea.value);
      } else {
        editorDiv.innerHTML = textarea.value;
      }

      // Vytvoření toolbaru
      var toolbar = document.createElement('div');
      toolbar.id = 'editor-toolbar';
      toolbar.style.display = 'flex';
      toolbar.style.flexWrap = 'wrap';
      toolbar.style.border = '1px solid #ccc';
      toolbar.style.padding = '5px';
      toolbar.style.backgroundColor = '#f1f1f1';

      // Nastavení velikosti ikon
      var iconSize = 24;

      // Funkce pro vytvoření tlačítka s ikonou
      function createButton(iconName, command, value, langKey, isEnabled) {
        if (isEnabled === false) {
          return; // Nepřidávat tlačítko, pokud není povoleno
        }
        var button = document.createElement('button');
        button.style.backgroundImage = 'url(./img/' + iconName + ')';
        button.style.backgroundSize = iconSize + 'px ' + iconSize + 'px';
        button.style.width = iconSize + 'px';
        button.style.height = iconSize + 'px';
        button.style.border = 'none';
        button.style.backgroundColor = 'transparent';
        button.style.cursor = 'pointer';
        button.style.margin = '2px';
        button.title = lang[langKey] || langKey;

        button.addEventListener('click', function(e) {
          e.preventDefault();
          editorDiv.focus();
          if (command === 'customCodeBlock') {
            // Obalí vybraný text do ```kód```
            var selection = window.getSelection();
            if (selection.rangeCount > 0) {
              var range = selection.getRangeAt(0);
              var selectedText = range.toString();
              var codeNode;
              if (isWikiMode) {
                codeNode = document.createTextNode('```\n' +
                  selectedText + '\n```');
              } else {
                codeNode = document.createElement('pre');
                var codeElement = document.createElement('code');
                codeElement.textContent = selectedText;
                codeNode.appendChild(codeElement);
              }
              range.deleteContents();
              range.insertNode(codeNode);
              selection.removeAllRanges();
              var newRange = document.createRange();
              newRange.setStartAfter(codeNode);
              newRange.collapse(true);
              selection.addRange(newRange);
              updateFooter();
            }
          } else if (command === 'createLink' ||
                     command === 'insertImage') {
            var url = prompt(lang['prompt_url'] || 'Zadejte URL:',
                             'http://');
            if (url) {
              document.execCommand(command, false, url);
            }
          } else if (command === 'fontName' || command === 'fontSize' ||
                     command === 'foreColor') {
            document.execCommand(command, false, value);
          } else {
            document.execCommand(command, false, value || null);
          }
          updateFooter();
        });

        if (command === 'customCodeBlock' && isWikiMode) {
          // Vloží tlačítko CODE na levou stranu
          toolbar.insertBefore(button, toolbar.firstChild);
        } else {
          toolbar.appendChild(button);
        }
      }

      // Vytvoření tlačítek s ohledem na WIKI režim
      createButton('code-icon.png', 'customCodeBlock', null, 'code');
      createButton('bold-icon.png', 'bold', null, 'bold');
      createButton('underline-icon.png', 'underline', null, 'underline');
      createButton('italic-icon.png', 'italic', null, 'italic');
      createButton('strikethrough-icon.png', 'strikeThrough', null,
                   'strikethrough', !isWikiMode);
      createButton('superscript-icon.png', 'superscript', null,
                   'superscript', !isWikiMode);
      createButton('subscript-icon.png', 'subscript', null, 'subscript',
                   !isWikiMode);
      createButton('text-align-left-icon.png', 'justifyLeft', null,
                   'align_left', !isWikiMode);
      createButton('text-align-center.png', 'justifyCenter', null,
                   'align_center', !isWikiMode);
      createButton('text-align-right-icon.png', 'justifyRight', null,
                   'align_right', !isWikiMode);
      createButton('text-align-justify-icon.png', 'justifyFull', null,
                   'align_justify', !isWikiMode);
      createButton('numbering-icon.png', 'insertOrderedList', null,
                   'ordered_list');
      createButton('bullet-point-icon.png', 'insertUnorderedList', null,
                   'unordered_list');
      createButton('edit-image-icon.png', 'insertImage', null,
                   'insert_image', !isWikiMode);
      createButton('link-icon.png', 'createLink', null, 'insert_link');

      // Přidání tlačítek pro nadpisy H1-H4
      createButton('h1-icon.png', 'formatBlock', '<h1>', 'heading_1');
      createButton('h2-icon.png', 'formatBlock', '<h2>', 'heading_2');
      createButton('h3-icon.png', 'formatBlock', '<h3>', 'heading_3');
      createButton('h4-icon.png', 'formatBlock', '<h4>', 'heading_4');

      // Výběr velikosti písma (vypnuto ve WIKI režimu)
      if (!isWikiMode) {
        var fontSizeSelect = document.createElement('select');
        fontSizeSelect.title = lang['font_size'] || 'Velikost písma';
        [1, 2, 3, 4, 5, 6, 7].forEach(function(size) {
          var option = document.createElement('option');
          option.value = size;
          option.textContent = size;
          fontSizeSelect.appendChild(option);
        });
        fontSizeSelect.addEventListener('change', function() {
          document.execCommand('fontSize', false, fontSizeSelect.value);
          editorDiv.focus();
          updateFooter();
        });
        toolbar.appendChild(fontSizeSelect);

        // Výběr fontu
        var fontNameSelect = document.createElement('select');
        fontNameSelect.title = lang['font_name'] || 'Typ písma';
        ['Arial', 'Courier New', 'Times New Roman', 'Verdana']
          .forEach(function(name) {
          var option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          fontNameSelect.appendChild(option);
        });
        fontNameSelect.addEventListener('change', function() {
          document.execCommand('fontName', false, fontNameSelect.value);
          editorDiv.focus();
          updateFooter();
        });
        toolbar.appendChild(fontNameSelect);

        // Výběr barvy písma
        var fontColorInput = document.createElement('input');
        fontColorInput.type = 'color';
        fontColorInput.title = lang['font_color'] || 'Barva písma';
        fontColorInput.addEventListener('change', function() {
          document.execCommand('foreColor', false, fontColorInput.value);
          editorDiv.focus();
          updateFooter();
        });
        toolbar.appendChild(fontColorInput);
      }

      // Přepínací tlačítko mezi vizuálním a kódovým režimem
      var toggleButton = document.createElement('button');
      toggleButton.textContent = lang['code_mode'] || 'Kódový režim';
      toggleButton.style.marginLeft = 'auto';
      toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (editorDiv.style.display !== 'none') {
          // Přepnutí do kódového režimu
          editorDiv.style.display = 'none';
          textarea.style.display = 'block';
          toggleButton.textContent = lang['visual_mode'] ||
                                     'Vizuální režim';
          textarea.value = isWikiMode ? convertHTMLToWiki(editorDiv
                         .innerHTML) : editorDiv.innerHTML;
          textarea.style.height = editorDiv.offsetHeight + 'px';
        } else {
          // Přepnutí do vizuálního režimu
          textarea.style.display = 'none';
          editorDiv.style.display = 'block';
          toggleButton.textContent = lang['code_mode'] || 'Kódový režim';
          if (isWikiMode) {
            editorDiv.innerHTML = convertWikiToHTML(textarea.value);
          } else {
            editorDiv.innerHTML = textarea.value;
          }
        }
        updateFooter();
      });
      toolbar.appendChild(toggleButton);

      // Přidání tlačítka nápovědy
      var helpButton = document.createElement('button');
      helpButton.textContent = '?';
      helpButton.style.marginLeft = '5px';
      helpButton.addEventListener('click', function(e) {
        e.preventDefault();
        alert(
          (lang['author'] || 'Autor') + ': PB\n' +
          (lang['email'] || 'Email') + ': pavel.bartos.pb@gmail.com\n' +
          (lang['year'] || 'Rok') + ': 2024'
        );
      });
      toolbar.appendChild(helpButton);

      // Vložení toolbaru před editor
      editorDiv.parentNode.insertBefore(toolbar, editorDiv);

      // Vytvoření patičky pro zobrazení informací
      var footer = document.createElement('div');
      footer.id = 'editor-footer';
      footer.style.borderTop = '1px solid #ccc';
      footer.style.padding = '5px';
      footer.style.fontSize = '12px';
      footer.style.backgroundColor = '#f9f9f9';
      footer.style.display = 'flex';
      footer.style.justifyContent = 'space-between';
      editorDiv.parentNode.insertBefore(footer, editorDiv.nextSibling);

      // Funkce pro aktualizaci patičky
      function updateFooter() {
        var content = (editorDiv.style.display !== 'none') ?
                      editorDiv.textContent : textarea.value;
        var lines = content.split(/\r\n|\r|\n/);
        var lineCount = lines.length;
        var charCount = content.length;
        var wordCount = content.trim().split(/\s+/).filter(Boolean).length;

        var selection = window.getSelection();
        var lineNumber = 1;
        if (selection.rangeCount > 0) {
          var range = selection.getRangeAt(0);
          var preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorDiv);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          var textBeforeCaret = preCaretRange.toString();
          var caretLines = textBeforeCaret.split(/\r\n|\r|\n/);
          lineNumber = caretLines.length;
        }

        footer.innerHTML =
          '<span>' +
          (lang['lines'] || 'Řádky') + ': ' + lineCount +
          ' | ' + (lang['current_line'] || 'Aktuální řádek') + ': ' +
          lineNumber +
          ' | ' + (lang['characters'] || 'Znaky') + ': ' + charCount +
          ' | ' + (lang['words'] || 'Slova') + ': ' + wordCount +
          '</span>' +
          '<span>' +
          (lang['mode'] || 'Režim') + ': ' + (isWikiMode ? 'Wiki' :
          'HTML') +
          '</span>';
      }

      // Funkce pro konverzi mezi HTML a WIKI
      function convertHTMLToWiki(html) {
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Odstranění stylů a tagů
        function recursiveText(node) {
          var result = '';
          node.childNodes.forEach(function(child) {
            if (child.nodeType === 3) { // Text node
              result += child.nodeValue;
            } else if (child.nodeType === 1) { // Element node
              if (child.tagName === 'BR') {
                result += '\n';
              } else {
                result += recursiveText(child);
                if (child.tagName === 'P' || child.tagName === 'DIV') {
                  result += '\n';
                }
              }
            }
          });
          return result;
        }

        var wiki = recursiveText(tempDiv);
        return wiki.trim();
      }

      function convertWikiToHTML(wiki) {
        var html = wiki.replace(/&/g, '&amp;').replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html = html.replace(/(\r\n|\r|\n)/g, '<br>');
        return html.trim();
      }

      // Aktualizace obsahu textarea při změně obsahu editoru
      editorDiv.addEventListener('input', function() {
        var content = editorDiv.innerHTML;
        if (isWikiMode) {
          textarea.value = convertHTMLToWiki(content);
        } else {
          textarea.value = content;
        }
        updateFooter();
      });

      // Aktualizace obsahu editoru při změně obsahu textarea
      textarea.addEventListener('input', function() {
        if (isWikiMode) {
          editorDiv.innerHTML = convertWikiToHTML(textarea.value);
        } else {
          editorDiv.innerHTML = textarea.value;
        }
        updateFooter();
      });

      // Aktualizace patičky při změně výběru
      editorDiv.addEventListener('keyup', updateFooter);
      editorDiv.addEventListener('click', updateFooter);

      // Inicializace patičky
      updateFooter();
    });
  });
})();

