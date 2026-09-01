import Image from "next/image";
import {
  blogDocHeadings,
  type BlogDoc,
  type BlogDocMark,
  type BlogDocNode,
} from "@/lib/blog/doc";

/**
 * Renderer server-side del documento Tiptap. Emette markup semantico e classi
 * `tenant-blog-doc-*`: ogni tenant le stila nel proprio foglio di stile, questo
 * componente non porta alcun colore o token.
 *
 * Gli id dei titoli devono coincidere con quelli di `blogDocHeadings` (usato per
 * il sommario): la coda qui sotto consuma gli id nello stesso ordine in cui
 * quella funzione li genera — solo i titoli di primo livello del documento.
 */

function renderMarks(text: string, marks: BlogDocMark[] | undefined, key: string) {
  if (!marks?.length) return text;
  return marks.reduce<React.ReactNode>((node, mark) => {
    if (mark.type === "bold") return <strong key={key}>{node}</strong>;
    if (mark.type === "italic") return <em key={key}>{node}</em>;
    if (mark.type === "underline") return <u key={key}>{node}</u>;
    if (mark.type === "strike") return <s key={key}>{node}</s>;
    if (mark.type === "code") return <code key={key}>{node}</code>;
    if (mark.type === "subscript") return <sub key={key}>{node}</sub>;
    if (mark.type === "superscript") return <sup key={key}>{node}</sup>;
    if (mark.type === "link") {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
      const external = typeof mark.attrs?.target === "string";
      return (
        <a
          key={key}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {node}
        </a>
      );
    }
    return node;
  }, text);
}

function renderInline(nodes: BlogDocNode[] | undefined, keyPrefix: string): React.ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === "text") return <span key={key}>{renderMarks(node.text ?? "", node.marks, key)}</span>;
    if (node.type === "hardBreak") return <br key={key} />;
    return null;
  });
}

function renderChildren(node: BlogDocNode, keyPrefix: string): React.ReactNode {
  return node.content?.map((child, index) => renderNode(child, `${keyPrefix}-${index}`));
}

function renderNode(node: BlogDocNode, key: string): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className="tenant-blog-doc-paragraph" style={textAlignStyle(node)}>
          {renderInline(node.content, key)}
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level ?? 3);
      const Tag = (`h${Math.min(Math.max(level, 2), 4)}` as unknown) as "h2" | "h3" | "h4";
      return (
        <Tag key={key} className="tenant-blog-doc-heading" style={textAlignStyle(node)}>
          {renderInline(node.content, key)}
        </Tag>
      );
    }
    case "horizontalRule":
      return <hr key={key} className="tenant-blog-doc-rule" />;
    case "bulletList":
      return (
        <ul key={key} className="tenant-blog-doc-list">
          {renderChildren(node, key)}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="tenant-blog-doc-list" start={typeof node.attrs?.start === "number" ? node.attrs.start : undefined}>
          {renderChildren(node, key)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderChildren(node, key)}</li>;
    case "blockquote":
      return (
        <blockquote key={key} className="tenant-blog-doc-blockquote">
          {renderChildren(node, key)}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre key={key} className="tenant-blog-doc-code">
          <code>{node.content?.map((child) => child.text).join("") ?? ""}</code>
        </pre>
      );
    case "tableSimple":
      return (
        <div key={key} className="tenant-blog-doc-table-wrap">
          <table className="tenant-blog-doc-table" data-has-header={node.attrs?.hasHeader ? "true" : undefined}>
            <tbody>{renderChildren(node, key)}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{renderChildren(node, key)}</tr>;
    case "tableCell":
      return (
        <td key={key} colSpan={typeof node.attrs?.colspan === "number" ? node.attrs.colspan : undefined} rowSpan={typeof node.attrs?.rowspan === "number" ? node.attrs.rowspan : undefined}>
          {renderChildren(node, key)}
        </td>
      );
    case "mediaFigure": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (!src) return null;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      const caption = typeof node.attrs?.caption === "string" ? node.attrs.caption : null;
      const credit = typeof node.attrs?.credit === "string" ? node.attrs.credit : null;
      return (
        <figure key={key} className="tenant-blog-doc-figure">
          <span className="tenant-blog-doc-figure-frame">
            <Image src={src} alt={alt} fill className="tenant-blog-doc-figure-img" sizes="(min-width: 768px) 720px, 100vw" />
          </span>
          {(caption || credit) && (
            <figcaption>
              {caption}
              {credit ? <cite> · {credit}</cite> : null}
            </figcaption>
          )}
        </figure>
      );
    }
    case "gallery": {
      const items = Array.isArray(node.attrs?.items) ? (node.attrs.items as { src?: string; alt?: string }[]) : [];
      if (!items.length) return null;
      return (
        <div key={key} className="tenant-blog-doc-gallery" data-layout={typeof node.attrs?.layout === "string" ? node.attrs.layout : "grid"}>
          {items.map((item, index) =>
            item.src ? (
              <span className="tenant-blog-doc-gallery-item" key={`${key}-${index}`}>
                <Image src={item.src} alt={item.alt ?? ""} fill className="tenant-blog-doc-figure-img" sizes="33vw" />
              </span>
            ) : null,
          )}
        </div>
      );
    }
    case "videoEmbed": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (!src) return null;
      const title = typeof node.attrs?.title === "string" ? node.attrs.title : "Video";
      return (
        <div key={key} className="tenant-blog-doc-video">
          <video src={src} controls poster={typeof node.attrs?.poster === "string" ? node.attrs.poster : undefined} aria-label={title} />
        </div>
      );
    }
    case "audioEmbed": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : null;
      if (!src) return null;
      return (
        <div key={key} className="tenant-blog-doc-audio">
          <audio src={src} controls />
          {typeof node.attrs?.title === "string" ? <span>{node.attrs.title}</span> : null}
        </div>
      );
    }
    case "socialEmbed": {
      const url = typeof node.attrs?.url === "string" ? node.attrs.url : null;
      if (!url) return null;
      return (
        <a key={key} className="tenant-blog-doc-social" href={url} target="_blank" rel="noopener noreferrer">
          {typeof node.attrs?.thumbnailUrl === "string" ? (
            <span className="tenant-blog-doc-social-thumb">
              <Image src={node.attrs.thumbnailUrl} alt="" fill className="tenant-blog-doc-figure-img" sizes="480px" />
            </span>
          ) : null}
          <span>
            {typeof node.attrs?.author === "string" ? <strong>{node.attrs.author}</strong> : null}
            {typeof node.attrs?.excerpt === "string" ? <span>{node.attrs.excerpt}</span> : null}
          </span>
        </a>
      );
    }
    case "callout": {
      const variant = typeof node.attrs?.variant === "string" ? node.attrs.variant : "note";
      const title = typeof node.attrs?.title === "string" ? node.attrs.title : null;
      return (
        <div key={key} className="tenant-blog-doc-callout" data-variant={variant}>
          {title ? <strong>{title}</strong> : null}
          {renderChildren(node, key)}
        </div>
      );
    }
    case "quotePull": {
      const attribution = typeof node.attrs?.attribution === "string" ? node.attrs.attribution : null;
      return (
        <blockquote key={key} className="tenant-blog-doc-pull">
          {renderChildren(node, key)}
          {attribution ? <cite>{attribution}</cite> : null}
        </blockquote>
      );
    }
    case "faq":
      return (
        <dl key={key} className="tenant-blog-doc-faq">
          {renderChildren(node, key)}
        </dl>
      );
    case "faqItem": {
      const question = typeof node.attrs?.question === "string" ? node.attrs.question : "";
      return (
        <div key={key} className="tenant-blog-doc-faq-item">
          <dt>{question}</dt>
          <dd>{renderChildren(node, key)}</dd>
        </div>
      );
    }
    case "ctaBlock": {
      const href = typeof node.attrs?.href === "string" ? node.attrs.href : null;
      const label = typeof node.attrs?.label === "string" ? node.attrs.label : null;
      if (!href || !label) return null;
      const external = /^https?:/.test(href);
      return (
        <a
          key={key}
          className="tenant-blog-doc-cta"
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {label}
        </a>
      );
    }
    case "recipe": {
      const ingredients = Array.isArray(node.attrs?.ingredients) ? (node.attrs.ingredients as string[]) : [];
      const steps = Array.isArray(node.attrs?.steps) ? (node.attrs.steps as string[]) : [];
      if (!ingredients.length && !steps.length) return null;
      return (
        <div key={key} className="tenant-blog-doc-recipe">
          {ingredients.length ? (
            <div>
              <h4>Ingredienti</h4>
              <ul>{ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul>
            </div>
          ) : null}
          {steps.length ? (
            <div>
              <h4>Procedimento</h4>
              <ol>{steps.map((item, index) => <li key={index}>{item}</li>)}</ol>
            </div>
          ) : null}
        </div>
      );
    }
    default:
      return null;
  }
}

function textAlignStyle(node: BlogDocNode): React.CSSProperties | undefined {
  const align = node.attrs?.textAlign;
  return typeof align === "string" && align !== "left" ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined;
}

export function BlogDocRenderer({ doc }: { doc: BlogDoc }) {
  const headingQueue = blogDocHeadings(doc).map((heading) => heading.id);
  let headingCursor = 0;

  return (
    <div className="tenant-blog-doc">
      {doc.content.map((node, index) => {
        const key = `top-${index}`;
        if (node.type === "heading") {
          const id = headingQueue[headingCursor++];
          const level = Number(node.attrs?.level ?? 3);
          const Tag = (`h${Math.min(Math.max(level, 2), 4)}` as unknown) as "h2" | "h3" | "h4";
          return (
            <Tag key={key} id={id} className="tenant-blog-doc-heading" style={textAlignStyle(node)}>
              {renderInline(node.content, key)}
            </Tag>
          );
        }
        return renderNode(node, key);
      })}
    </div>
  );
}
