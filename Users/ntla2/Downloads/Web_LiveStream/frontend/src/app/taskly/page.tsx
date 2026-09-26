"use client";
import React, { useState, useEffect } from "react";
import { TaskAPI } from "@/lib/api";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string;
  priority: string;
};

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];

export default function TasklyKanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTasks = async () => {
    try {
      const res: any = await TaskAPI.getAll();
      const fetchedTasks = Array.isArray(res) ? res : (res?.data || []);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    const id = e.dataTransfer.getData("taskId");
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === status) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));

    try {
      await TaskAPI.update(id, { status });
    } catch (err) {
      console.error(err);
      loadTasks(); // Revert on failure
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await TaskAPI.create({ title: newTaskTitle, status: "TODO" });
      setNewTaskTitle("");
      loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await TaskAPI.delete(id);
      loadTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gray-50 text-black">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Taskly Kanban</h1>
      
      <form onSubmit={addTask} className="mb-8 flex gap-4">
        <input 
          type="text" 
          value={newTaskTitle} 
          onChange={e => setNewTaskTitle(e.target.value)} 
          placeholder="New Task Title"
          className="border border-gray-300 p-2 rounded w-64 text-black"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Task
        </button>
      </form>

      <div className="flex gap-6">
        {STATUSES.map(status => (
          <div 
            key={status} 
            className="flex-1 bg-gray-200 p-4 rounded-lg min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h2 className="font-semibold text-lg mb-4 text-gray-700">{status.replace('_', ' ')}</h2>
            <div className="flex flex-col gap-3">
              {tasks.filter(t => t.status === status).map(task => (
                <div 
                  key={task.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="bg-white p-4 rounded shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing flex justify-between group"
                >
                  <span className="text-gray-800 font-medium">{task.title}</span>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

