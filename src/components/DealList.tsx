import React, { useState } from 'react';
import { Search, Plus, Target, DollarSign, Calendar, TrendingUp, Edit, Trash2, MessageSquare } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Project } from '../types';
import ProjectForm from './Forms/ProjectForm';
import ConfirmationCard from './ConfirmationCard';
import StatusUpdateModal from './StatusUpdateModal';
import { supabase } from '../lib/supabase';

const ProjectList: React.FC = () => {
  const { projects, loading, refetch } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deletingProject, setDeletingProject] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ projectId: string; projectName: string } | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ projectId: string; projectName: string } | null>(null);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStageColor = (stage: Project['stage']) => {
    switch (stage) {
      case 'lead': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setConfirmDelete({ projectId, projectName: project?.title || 'this project' });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setDeletingProject(confirmDelete.projectId);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', confirmDelete.projectId);
      
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setConfirmDelete(null);
      setDeletingProject(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-300 glow-green">Client Solutions</h1>
          <p className="text-green-400 mt-1">Active client projects and solutions</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="tech-button px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Solution</span>
        </button>
      </div>

      {/* Filters */}
      <div className="tech-card rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search solutions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="tech-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-900 bg-opacity-30 border-b border-green-800">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Solution</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Company</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Description</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Deadline</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr key={project.id} className={`border-b border-green-800 hover:bg-green-900 hover:bg-opacity-20 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-transparent' : 'bg-green-900 bg-opacity-10'
                }`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
                        <Target className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-300">{project.title}</h3>
                        <p className="text-sm text-green-500">Created {project.createdAt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-green-300">{project.company}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 text-sm">{project.description}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-green-400" />
                      <span className="text-green-300">{project.expectedCloseDate}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setStatusUpdateModal({ projectId: project.id, projectName: project.title })}
                        className="p-1 text-green-400 hover:text-blue-400 transition-colors rounded hover:bg-blue-900 hover:bg-opacity-30"
                        title="Status Update"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-1 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-green-900 hover:bg-opacity-30"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingProject === project.id}
                        className="p-1 text-green-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded hover:bg-red-900 hover:bg-opacity-30"
                      >
                        {deletingProject === project.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-green-400">No client solutions found matching your criteria.</p>
        </div>
      )}

      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmationCard
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${confirmDelete?.projectName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deletingProject !== null}
      />
      {statusUpdateModal && (
        <StatusUpdateModal
          isOpen={!!statusUpdateModal}
          onClose={() => setStatusUpdateModal(null)}
          targetType="project"
          targetId={statusUpdateModal.projectId}
          targetName={statusUpdateModal.projectName}
        />
      )}
      </div>
    </>
  );
};


export default ProjectList