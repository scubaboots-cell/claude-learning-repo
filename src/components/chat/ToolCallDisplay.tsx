"use client";

import { Loader2, FileText, FolderOpen, Edit3, Trash2 } from "lucide-react";

interface ToolCall {
  toolName: string;
  state: "result" | "pending";
  args?: any;
  result?: any;
}

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

function getToolMessage(toolName: string, args: any): { message: string; icon: React.ReactNode } {
  switch (toolName) {
    case "str_replace_editor":
      if (args?.command === "create") {
        return {
          message: `Creating file: ${args.path || "new file"}`,
          icon: <FileText className="w-3 h-3" />
        };
      } else if (args?.command === "str_replace") {
        return {
          message: `Editing file: ${args.path || "file"}`,
          icon: <Edit3 className="w-3 h-3" />
        };
      } else if (args?.command === "view") {
        return {
          message: `Viewing file: ${args.path || "file"}`,
          icon: <FileText className="w-3 h-3" />
        };
      } else if (args?.command === "insert") {
        return {
          message: `Inserting into file: ${args.path || "file"}`,
          icon: <Edit3 className="w-3 h-3" />
        };
      }
      return {
        message: "Working with file",
        icon: <FileText className="w-3 h-3" />
      };

    case "file_manager":
      if (args?.command === "rename") {
        return {
          message: `Renaming: ${args.path || "file"} → ${args.new_path || "new name"}`,
          icon: <FolderOpen className="w-3 h-3" />
        };
      } else if (args?.command === "delete") {
        return {
          message: `Deleting: ${args.path || "file"}`,
          icon: <Trash2 className="w-3 h-3" />
        };
      }
      return {
        message: "Managing files",
        icon: <FolderOpen className="w-3 h-3" />
      };

    default:
      return {
        message: `Running ${toolName}`,
        icon: <FileText className="w-3 h-3" />
      };
  }
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const { message, icon } = getToolMessage(toolCall.toolName, toolCall.args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {toolCall.state === "result" ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          {icon}
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}