import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function MarkdownRenderer({
	children,
	className,
}: {
	children: string | React.ReactNode;
	className?: string;
}) {
	// Ensure children is a string
	const content =
		typeof children === "string" ? children : String(children || "");

	const components = {
		// Headings with better typography and IDs for navigation
		h1: ({ node, children, ...props }: any) => {
			const text =
				typeof children === "string"
					? children
					: Array.isArray(children)
						? children.join("")
						: "";
			const id = text.toLowerCase().replace(/\s+/g, "-");
			return (
				<h1
					id={id}
					className="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0 scroll-mt-20"
					{...props}
				>
					{children}
				</h1>
			);
		},
		h2: ({ node, children, ...props }: any) => {
			const text =
				typeof children === "string"
					? children
					: Array.isArray(children)
						? children.join("")
						: "";
			const id = text.toLowerCase().replace(/\s+/g, "-");
			return (
				<h2
					id={id}
					className="text-2xl font-semibold text-foreground mt-6 mb-4 flex items-center gap-2 scroll-mt-20"
					{...props}
				>
					{children}
				</h2>
			);
		},
		h3: ({ node, children, ...props }: any) => {
			const text =
				typeof children === "string"
					? children
					: Array.isArray(children)
						? children.join("")
						: "";
			const id = text.toLowerCase().replace(/\s+/g, "-");
			return (
				<h3
					id={id}
					className="text-xl font-semibold text-foreground mt-4 mb-4 scroll-mt-20"
					{...props}
				>
					{children}
				</h3>
			);
		},
		h4: ({ node, children, ...props }: any) => {
			const text =
				typeof children === "string"
					? children
					: Array.isArray(children)
						? children.join("")
						: "";
			const id = text.toLowerCase().replace(/\s+/g, "-");
			return (
				<h4
					id={id}
					className="text-lg font-medium text-foreground mt-3 mb-3 scroll-mt-20"
					{...props}
				>
					{children}
				</h4>
			);
		},

		// Paragraphs with better spacing
		p: ({ node, children, ...props }: any) => (
			<p className="text-foreground leading-relaxed mb-4" {...props}>
				{children}
			</p>
		),

		// Enhanced lists
		ul: ({ node, children, ...props }: any) => (
			<ul className="ml-5 my-4 list-disc text-foreground" {...props}>
				{children}
			</ul>
		),
		ol: ({ node, children, ...props }: any) => (
			<ol className="ml-5 my-4 list-decimal text-foreground" {...props}>
				{children}
			</ol>
		),
		li: ({ node, children, ordered, index, ...props }: any) => {
			return (
				<li className="text-foreground" {...props}>
					{children}
				</li>
			);
		},
		// Strong text
		strong: ({ node, children, ...props }: any) => (
			<strong className="font-semibold text-foreground" {...props}>
				{children}
			</strong>
		),
		// Horizontal rules
		hr: ({ node, ...props }: any) => (
			<hr className="my-8 border-gray-300" {...props} />
		),
	};

	return (
		<div className={cn("max-w-none", className)}>
			<ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
				{content}
			</ReactMarkdown>
		</div>
	);
}

const MarkdownEnhanced = React.memo(
	MarkdownRenderer,
	(prevProps, nextProps) =>
		prevProps.children === nextProps.children &&
		prevProps.className === nextProps.className,
);

export default MarkdownEnhanced;
