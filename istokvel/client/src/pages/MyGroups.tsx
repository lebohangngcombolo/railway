import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Loader2, Users, Search } from "lucide-react";

const MyGroups: React.FC = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyGroups = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/dashboard/my-groups");
        setGroups(res.data);
      } catch (err) {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGroups();
  }, []);

  // Filter groups by search
  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-500 mb-6 space-x-2">
        <span
          className="hover:underline text-blue-600 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </span>
        <span>/</span>
        <span className="text-gray-700 font-semibold">My Groups</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-500" />
          My Groups
        </h1>
        <div className="relative w-full md:w-72">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search groups..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          {groups.length === 0
            ? "You are not a member of any groups yet."
            : "No groups match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col justify-between border border-indigo-100"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 font-bold text-lg">
                    {group.name[0]}
                  </span>
                  <span className="text-lg font-semibold text-gray-800">{group.name}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    Tier: {group.tier}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Category: {group.category}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Members: {group.member_count}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {group.description}
                </div>
              </div>
              <button
                className="mt-2 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                onClick={() => navigate(`/dashboard/stokvel-groups/${group.id}`)}
              >
                View Group
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MyGroups;
