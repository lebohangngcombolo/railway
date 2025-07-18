import React, { useState } from "react";
import { adminAPI } from "../../services/api";

const GroupEditModal = ({ group, isOpen, onClose, onSave }: any) => {
  const [name, setName] = useState(group?.name || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !group) return null;

  const handleSave = async () => {
    setLoading(true);
    await adminAPI.updateGroup(group.id, { ...group, name });
    setLoading(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Rename Group</h2>
        <input
          className="w-full border border-gray-200 rounded px-3 py-2 mb-4"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded bg-indigo-600 text-white"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupEditModal; 