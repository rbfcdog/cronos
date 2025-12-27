/**
 * Workflow Template Selector
 * 
 * Browse and load pre-built agent workflows
 */

"use client";

import { useState } from "react";
import {
  ALL_WORKFLOW_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  TEMPLATES_BY_DIFFICULTY,
  WorkflowTemplate,
} from "@/lib/workflow-templates";

interface WorkflowTemplateSelectorProps {
  onLoadTemplate: (template: WorkflowTemplate) => void;
}

export default function WorkflowTemplateSelector({ onLoadTemplate }: WorkflowTemplateSelectorProps) {
  const [filter, setFilter] = useState<"all" | "payments" | "defi" | "treasury" | "demo">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "beginner" | "intermediate" | "advanced">("all");

  const filteredTemplates = ALL_WORKFLOW_TEMPLATES.filter((template) => {
    const categoryMatch = filter === "all" || template.category === filter;
    const difficultyMatch = difficultyFilter === "all" || template.difficulty === difficultyFilter;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-300";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payments":
        return "💰";
      case "defi":
        return "📊";
      case "treasury":
        return "🏦";
      case "demo":
        return "🤖";
      default:
        return "📦";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🤖 Agent Workflow Templates
        </h2>
        <p className="text-gray-600">
          Pre-built workflows showcasing high-value agents. Click any template to load it into the editor.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("payments")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "payments"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              💰 Payments
            </button>
            <button
              onClick={() => setFilter("defi")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "defi"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📊 DeFi
            </button>
            <button
              onClick={() => setFilter("treasury")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "treasury"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏦 Treasury
            </button>
            <button
              onClick={() => setFilter("demo")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "demo"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🤖 Demo
            </button>
          </div>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDifficultyFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                difficultyFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Levels
            </button>
            <button
              onClick={() => setDifficultyFilter("beginner")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                difficultyFilter === "beginner"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              Beginner
            </button>
            <button
              onClick={() => setDifficultyFilter("intermediate")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                difficultyFilter === "intermediate"
                  ? "bg-yellow-600 text-white"
                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
              }`}
            >
              Intermediate
            </button>
            <button
              onClick={() => setDifficultyFilter("advanced")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                difficultyFilter === "advanced"
                  ? "bg-red-600 text-white"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onLoadTemplate(template)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium border rounded ${getDifficultyColor(
                  template.difficulty
                )}`}
              >
                {template.difficulty}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3">{template.description}</p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">⏱️ {template.estimatedTime}</span>
              <span className="text-gray-500">{template.plan.actions.length} actions</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  +{template.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No templates match your filters</p>
          <p className="text-sm mt-2">Try adjusting your category or difficulty selection</p>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{ALL_WORKFLOW_TEMPLATES.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {TEMPLATES_BY_CATEGORY.payments.length + TEMPLATES_BY_CATEGORY.defi.length}
            </div>
            <div className="text-sm text-gray-600">DeFi & Payments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {TEMPLATES_BY_CATEGORY.treasury.length}
            </div>
            <div className="text-sm text-gray-600">Treasury</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {TEMPLATES_BY_CATEGORY.demo.length}
            </div>
            <div className="text-sm text-gray-600">Multi-Agent</div>
          </div>
        </div>
      </div>
    </div>
  );
}
