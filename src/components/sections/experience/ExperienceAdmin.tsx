// src/components/sections/experience/ExperienceAdmin.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  type Experience,
} from "../../../services/api";
import { useNotification } from "../../../hooks/useNotification";
import ModalPortal from "../../common/ModalPortal";
import styles from "./ExperienceAdmin.module.css";

interface Education {
  id: number;
  title: string;
  institution: string;
  start_date: string;
  end_date: string;
  description?: string;
  grade?: string;
}

interface ExperienceAdminProps {
  onClose: () => void;
}

const ExperienceAdmin: React.FC<ExperienceAdminProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"experience" | "education">("experience");
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<"experience" | "education">("experience");
  const [saving, setSaving] = useState(false);
  const [technologyInput, setTechnologyInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsIndex, setSuggestionsIndex] = useState(-1);
  const { showSuccess, showError } = useNotification();
  
  // Referencias para funcionalidad avanzada
  const technologyInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sugerencias de tecnologías comunes
  const technologySuggestions = [
    "React", "Vue.js", "Angular", "JavaScript", "TypeScript", "Node.js", "Express.js",
    "Python", "Django", "Flask", "Java", "Spring Boot", "C#", ".NET", "PHP", "Laravel",
    "HTML5", "CSS3", "SASS", "SCSS", "Tailwind CSS", "Bootstrap", "Material-UI",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Azure",
    "Git", "GitHub", "GitLab", "Jenkins", "Jest", "Cypress", "Webpack", "Vite"
  ];

  // Estados del formulario para experiencia
  const [experienceForm, setExperienceForm] = useState({
    title: "",
    company: "",
    start_date: "",
    end_date: "",
    description: "",
    technologies: [] as string[],
    order_index: 0,
    is_current: false,
  });

  // Estados del formulario para educación
  const [educationForm, setEducationForm] = useState({
    title: "",
    institution: "",
    start_date: "",
    end_date: "",
    description: "",
    grade: "",
    order_index: 0,
    is_current: false,
  });

  // Estados de validación
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string | undefined}>({});
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({});

  const emptyExperienceForm = {
    title: "",
    company: "",
    start_date: "",
    end_date: "",
    description: "",
    technologies: [] as string[],
    order_index: 0,
    is_current: false,
  };

  const emptyEducationForm = {
    title: "",
    institution: "",
    start_date: "",
    end_date: "",
    description: "",
    grade: "",
    order_index: 0,
    is_current: false,
  };

  // Mock data para educación (temporal hasta implementar API)
  const mockEducation: Education[] = [
    {
      id: 1,
      title: "Grado en Ingeniería Informática",
      institution: "Universidad Tecnológica",
      start_date: "2018",
      end_date: "2022",
      description: "Especialización en Desarrollo de Software y Sistemas Distribuidos. Enfoque en arquitecturas modernas, bases de datos y metodologías ágiles.",
      grade: "Sobresaliente",
    },
    {
      id: 2,
      title: "Máster en Desarrollo Web Full Stack",
      institution: "Escuela de Programación Avanzada",
      start_date: "2022",
      end_date: "2023",
      description: "Especialización en tecnologías modernas de desarrollo web, incluyendo React, Node.js, bases de datos NoSQL y despliegue en la nube.",
      grade: "Excelente",
    },
  ];

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const data = await getExperiences();
      setExperiences(data);
    } catch (error) {
      console.error("Error cargando experiencias:", error);
      showError("Error", "No se pudieron cargar las experiencias");
    } finally {
      setLoading(false);
    }
  };

  const loadEducation = async () => {
    // Por ahora usamos datos mock, después implementar API
    setEducation(mockEducation);
  };

  useEffect(() => {
    loadExperiences();
    loadEducation();
  }, []);

  // Función de validación
  const validateField = (name: string, value: string, isExperience: boolean = true) => {
    const errors: {[key: string]: string} = {};
    
    if (isExperience) {
      switch (name) {
        case 'title':
          if (!value.trim()) errors.title = 'El título del puesto es obligatorio';
          else if (value.length < 2) errors.title = 'El título debe tener al menos 2 caracteres';
          break;
        case 'company':
          if (!value.trim()) errors.company = 'El nombre de la empresa es obligatorio';
          else if (value.length < 2) errors.company = 'El nombre debe tener al menos 2 caracteres';
          break;
        case 'start_date':
          if (!value) errors.start_date = 'La fecha de inicio es obligatoria';
          break;
        case 'description':
          if (value.length > 500) errors.description = 'La descripción no puede exceder 500 caracteres';
          break;
      }
    } else {
      switch (name) {
        case 'title':
          if (!value.trim()) errors.title = 'El título o grado es obligatorio';
          else if (value.length < 2) errors.title = 'El título debe tener al menos 2 caracteres';
          break;
        case 'institution':
          if (!value.trim()) errors.institution = 'El nombre de la institución es obligatorio';
          else if (value.length < 2) errors.institution = 'El nombre debe tener al menos 2 caracteres';
          break;
        case 'start_date':
          if (!value) errors.start_date = 'La fecha de inicio es obligatoria';
          break;
        case 'description':
          if (value.length > 500) errors.description = 'La descripción no puede exceder 500 caracteres';
          break;
      }
    }
    
    return errors;
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Actualizar el formulario
    setExperienceForm(prev => ({ 
      ...prev, 
      [name]: name === "order_index" ? parseInt(value) || 0 : value 
    }));

    // Marcar el campo como tocado
    setTouchedFields(prev => ({ ...prev, [name]: true }));

    // Validar el campo
    const fieldErrors = validateField(name, value, true);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
  };

  const handleEducationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Actualizar el formulario
    setEducationForm(prev => ({ 
      ...prev, 
      [name]: name === "order_index" ? parseInt(value) || 0 : value 
    }));

    // Marcar el campo como tocado
    setTouchedFields(prev => ({ ...prev, [name]: true }));

    // Validar el campo
    const fieldErrors = validateField(name, value, false);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
  };

  // Función para obtener clases de validación
  const getValidationClasses = (fieldName: string) => {
    if (!touchedFields[fieldName]) return '';
    const hasError = validationErrors[fieldName];
    return hasError ? styles.invalid : styles.valid;
  };

  const handleTechnologyAdd = (tech: string) => {
    if (tech.trim() && !experienceForm.technologies.includes(tech.trim())) {
      setExperienceForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, tech.trim()]
      }));
      setTechnologyInput("");
      setShowSuggestions(false);
      setSuggestionsIndex(-1);
    }
  };

  const handleTechnologyRemove = (index: number) => {
    setExperienceForm(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  const handleTechnologyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTechnologyInput(value);
    setShowSuggestions(value.length > 0);
    setSuggestionsIndex(-1);
  };

  const handleTechnologyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filteredSuggestions = getFilteredSuggestions();
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestionsIndex >= 0 && filteredSuggestions[suggestionsIndex]) {
        handleTechnologyAdd(filteredSuggestions[suggestionsIndex]);
      } else if (technologyInput.trim()) {
        handleTechnologyAdd(technologyInput);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionsIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionsIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestionsIndex(-1);
    }
  };

  const getFilteredSuggestions = () => {
    return technologySuggestions.filter(tech =>
      tech.toLowerCase().includes(technologyInput.toLowerCase()) &&
      !experienceForm.technologies.includes(tech)
    );
  };

  const handleCurrentToggle = (isExperience: boolean) => {
    if (isExperience) {
      setExperienceForm(prev => ({
        ...prev,
        is_current: !prev.is_current,
        end_date: !prev.is_current ? "" : prev.end_date
      }));
    } else {
      setEducationForm(prev => ({
        ...prev,
        is_current: !prev.is_current,
        end_date: !prev.is_current ? "" : prev.end_date
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingType === "experience") {
      await handleExperienceSubmit();
    } else {
      await handleEducationSubmit();
    }
  };

  const handleExperienceSubmit = async () => {
    if (!experienceForm.title.trim() || !experienceForm.company.trim() || !experienceForm.start_date.trim()) {
      showError("Error de validación", "Título, empresa y fecha de inicio son obligatorios");
      return;
    }

    try {
      setSaving(true);
      
      const experienceData = {
        ...experienceForm,
        user_id: 1,
        order_index: experienceForm.order_index || experiences.length,
      };

      if (editingId) {
        await updateExperience(editingId, experienceData);
        showSuccess("Experiencia actualizada", "Los cambios se han guardado correctamente");
      } else {
        await createExperience(experienceData);
        showSuccess("Experiencia creada", "La nueva experiencia se ha añadido correctamente");
      }

      await loadExperiences();
      handleCloseForm();
    } catch (error) {
      console.error("Error guardando experiencia:", error);
      showError("Error", "No se pudo guardar la experiencia");
    } finally {
      setSaving(false);
    }
  };

  const handleEducationSubmit = async () => {
    if (!educationForm.title.trim() || !educationForm.institution.trim() || !educationForm.start_date.trim()) {
      showError("Error de validación", "Título, institución y fecha de inicio son obligatorios");
      return;
    }

    try {
      setSaving(true);
      
      // Por ahora solo simulamos el guardado de educación
      // TODO: Implementar API para educación
      
      showSuccess("Educación guardada", "Los cambios se han guardado correctamente (simulado)");
      handleCloseForm();
    } catch (error) {
      console.error("Error guardando educación:", error);
      showError("Error", "No se pudo guardar la educación");
    } finally {
      setSaving(false);
    }
  };

  const handleEditExperience = (experience: Experience) => {
    setExperienceForm({
      title: experience.title,
      company: experience.company,
      start_date: experience.start_date,
      end_date: experience.end_date,
      description: experience.description || "",
      technologies: experience.technologies || [],
      order_index: experience.order_index,
      is_current: !experience.end_date || experience.end_date === "Presente",
    });
    setEditingId(experience.id);
    setEditingType("experience");
    setShowForm(true);
  };

  const handleEditEducation = (edu: Education) => {
    setEducationForm({
      title: edu.title,
      institution: edu.institution,
      start_date: edu.start_date,
      end_date: edu.end_date,
      description: edu.description || "",
      grade: edu.grade || "",
      order_index: edu.id, // Usando id temporal
      is_current: !edu.end_date || edu.end_date === "En curso",
    });
    setEditingId(edu.id);
    setEditingType("education");
    setShowForm(true);
  };

  const handleDeleteExperience = async (id: number, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar la experiencia "${title}"?`)) {
      return;
    }

    try {
      await deleteExperience(id);
      showSuccess("Experiencia eliminada", "La experiencia se ha eliminado correctamente");
      await loadExperiences();
    } catch (error) {
      console.error("Error eliminando experiencia:", error);
      showError("Error", "No se pudo eliminar la experiencia");
    }
  };
  const handleDeleteEducation = async (title: string) => {
    if (!confirm(`¿Estás seguro de eliminar la educación "${title}"?`)) {
      return;
    }

    // TODO: Implementar API para eliminar educación
    showSuccess("Educación eliminada", "La educación se ha eliminado correctamente (simulado)");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setExperienceForm(emptyExperienceForm);
    setEducationForm(emptyEducationForm);
    setEditingId(null);
    // Reset technology input
    setTechnologyInput("");
    setShowSuggestions(false);
    setSuggestionsIndex(-1);
  };

  const handleNewItem = (type: "experience" | "education") => {
    if (type === "experience") {
      setExperienceForm({
        ...emptyExperienceForm,
        order_index: experiences.length,
      });
    } else {
      setEducationForm({
        ...emptyEducationForm,
        order_index: education.length,
      });
    }
    setEditingId(null);
    setEditingType(type);
    setShowForm(true);
    // Reset technology input
    setTechnologyInput("");
    setShowSuggestions(false);
    setSuggestionsIndex(-1);
  };

  return (
    <ModalPortal>
      <div className={styles.experienceAdminOverlay}>
        <div className={styles.experienceAdminModal}>
          <div className="admin-header">
            <h2>
              <i className="fas fa-route"></i>
              Administración de Trayectoria
            </h2>
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Tabs para experiencia y educación */}
          <div className="admin-tabs">
            <button 
              className={`tab-btn ${activeTab === "experience" ? "active" : ""}`}
              onClick={() => setActiveTab("experience")}
            >
              <i className="fas fa-briefcase"></i>
              Experiencia Laboral
            </button>
            <button 
              className={`tab-btn ${activeTab === "education" ? "active" : ""}`}
              onClick={() => setActiveTab("education")}
            >
              <i className="fas fa-graduation-cap"></i>
              Formación Académica
            </button>
          </div>

          <div className="admin-toolbar">
            <button 
              className="new-item-btn"
              onClick={() => handleNewItem(activeTab)}
            >
              <i className="fas fa-plus"></i>
              Nueva {activeTab === "experience" ? "Experiencia" : "Educación"}
            </button>
          </div>

          <div className="admin-content">
            {loading ? (
              <div className="loading">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Cargando datos...</p>
              </div>
            ) : (
              <>
                {/* Panel de Experiencia */}
                {activeTab === "experience" && (
                  <>
                    {experiences.length === 0 ? (
                      <div className="empty-state">
                        <i className="fas fa-briefcase"></i>
                        <h3>No hay experiencias</h3>
                        <p>Añade la primera experiencia laboral usando el botón de arriba.</p>
                      </div>
                    ) : (
                      <div className="items-list">
                        {experiences.map((experience) => (
                          <div key={experience.id} className="admin-item-card">
                            <div className="item-header">
                              <div className="item-info">
                                <h3>{experience.title}</h3>
                                <p className="company">{experience.company}</p>
                                <p className="date">
                                  <i className="fas fa-calendar-alt"></i>
                                  {experience.start_date} - {experience.end_date}
                                </p>
                                {experience.technologies && experience.technologies.length > 0 && (
                                  <div className="technologies">
                                    {experience.technologies.map((tech, index) => (
                                      <span key={index} className="tech-tag">{tech}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="item-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditExperience(experience)}
                              >
                                <i className="fas fa-edit"></i>
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteExperience(experience.id, experience.title)}
                              >
                                <i className="fas fa-trash"></i>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Panel de Educación */}
                {activeTab === "education" && (
                  <>
                    {education.length === 0 ? (
                      <div className="empty-state">
                        <i className="fas fa-graduation-cap"></i>
                        <h3>No hay formación académica</h3>
                        <p>Añade la primera formación académica usando el botón de arriba.</p>
                      </div>
                    ) : (
                      <div className="items-list">
                        {education.map((edu) => (
                          <div key={edu.id} className="admin-item-card">
                            <div className="item-header">
                              <div className="item-info">
                                <h3>{edu.title}</h3>
                                <p className="institution">{edu.institution}</p>
                                <p className="date">
                                  <i className="fas fa-calendar-alt"></i>
                                  {edu.start_date} - {edu.end_date}
                                </p>
                                {edu.grade && (
                                  <p className="grade">
                                    <i className="fas fa-medal"></i>
                                    {edu.grade}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="item-actions">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditEducation(edu)}
                              >
                                <i className="fas fa-edit"></i>
                                Editar
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteEducation(edu.title)}
                              >
                                <i className="fas fa-trash"></i>
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Modal de formulario mejorado */}
          {showForm && (
            <div className={styles.formModalOverlay}>
              <div className={styles.formModal}>
                {/* Breadcrumb navigation */}
                <div className={styles.breadcrumb}>
                  <span className={styles.breadcrumbItem}>
                    <i className="fas fa-home"></i>
                    Administración
                  </span>
                  <span className={styles.breadcrumbSeparator}>
                    <i className="fas fa-chevron-right"></i>
                  </span>
                  <span className={styles.breadcrumbItem}>
                    <i className={`fas fa-${editingType === "experience" ? "briefcase" : "graduation-cap"}`}></i>
                    {editingType === "experience" ? "Experiencia" : "Educación"}
                  </span>
                  <span className={styles.breadcrumbSeparator}>
                    <i className="fas fa-chevron-right"></i>
                  </span>
                  <span className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}>
                    {editingId ? "Editar" : "Nuevo"}
                  </span>
                </div>

                {/* Header mejorado */}
                <div className={styles.formHeader}>
                  <h3>
                    <i className={`fas fa-${editingType === "experience" ? "briefcase" : "graduation-cap"}`}></i>
                    {editingId ? 
                      `Editar ${editingType === "experience" ? "Experiencia" : "Educación"}` : 
                      `Nueva ${editingType === "experience" ? "Experiencia" : "Educación"}`
                    }
                  </h3>
                  <button className={styles.closeBtn} onClick={handleCloseForm}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                {/* Indicador de progreso del formulario */}
                <div className={styles.progressIndicator}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${editingType === "experience" 
                          ? ((experienceForm.title ? 1 : 0) + 
                             (experienceForm.company ? 1 : 0) + 
                             (experienceForm.start_date ? 1 : 0) + 
                             (experienceForm.description ? 1 : 0)) / 4 * 100
                          : ((educationForm.title ? 1 : 0) + 
                             (educationForm.institution ? 1 : 0) + 
                             (educationForm.start_date ? 1 : 0) + 
                             (educationForm.description ? 1 : 0)) / 4 * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className={styles.progressText}>
                    Progreso del formulario: {editingType === "experience" 
                      ? Math.round(((experienceForm.title ? 1 : 0) + 
                                   (experienceForm.company ? 1 : 0) + 
                                   (experienceForm.start_date ? 1 : 0) + 
                                   (experienceForm.description ? 1 : 0)) / 4 * 100)
                      : Math.round(((educationForm.title ? 1 : 0) + 
                                   (educationForm.institution ? 1 : 0) + 
                                   (educationForm.start_date ? 1 : 0) + 
                                   (educationForm.description ? 1 : 0)) / 4 * 100)}%
                  </span>
                </div>

                {/* Formulario mejorado */}
                <form onSubmit={handleSubmit} className={styles.itemForm}>
                  {editingType === "experience" ? (
                    <>
                      {/* Información básica */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-info-circle"></i>
                          Información Básica
                        </h4>
                        <div className={`${styles.formGrid} ${styles.twoColumns}`}>
                          <div className={styles.formGroup}>
                            <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="exp-title">
                              <i className="fas fa-briefcase"></i>
                              Título del puesto
                            </label>
                            <input
                              type="text"
                              id="exp-title"
                              name="title"
                              value={experienceForm.title}
                              onChange={handleExperienceChange}
                              className={`${styles.modernInput} ${getValidationClasses('title')}`}
                              required
                              placeholder="Ej: Desarrollador Full Stack Senior"
                            />
                            {touchedFields.title && validationErrors.title && (
                              <div className={styles.errorMessage}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {validationErrors.title}
                              </div>
                            )}
                          </div>
                          <div className={styles.formGroup}>
                            <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="exp-company">
                              <i className="fas fa-building"></i>
                              Empresa
                            </label>
                            <input
                              type="text"
                              id="exp-company"
                              name="company"
                              value={experienceForm.company}
                              onChange={handleExperienceChange}
                              className={`${styles.modernInput} ${getValidationClasses('company')}`}
                              required
                              placeholder="Ej: TechCorp Solutions"
                            />
                            {touchedFields.company && validationErrors.company && (
                              <div className={styles.errorMessage}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {validationErrors.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Período de tiempo */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-calendar-alt"></i>
                          Período de Tiempo
                        </h4>
                        <div className={styles.dateRangeContainer}>
                          <div className={styles.dateRangePicker}>
                            <div className={styles.formGroup}>
                              <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="exp-start">
                                <i className="fas fa-play"></i>
                                Fecha de inicio
                              </label>
                              <input
                                type="month"
                                id="exp-start"
                                name="start_date"
                                value={experienceForm.start_date}
                                onChange={handleExperienceChange}
                                className={styles.modernInput}
                                required
                              />
                            </div>
                            <div className={styles.dateRangeSeparator}>
                              <i className="fas fa-arrow-right"></i>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.fixedLabel} htmlFor="exp-end">
                                <i className="fas fa-stop"></i>
                                Fecha de fin
                              </label>
                              <input
                                type="month"
                                id="exp-end"
                                name="end_date"
                                value={experienceForm.end_date}
                                onChange={handleExperienceChange}
                                className={styles.modernInput}
                                disabled={experienceForm.is_current}
                                placeholder={experienceForm.is_current ? "Actualidad" : ""}
                              />
                            </div>
                          </div>
                          <div className={styles.currentToggle}>
                            <input
                              type="checkbox"
                              id="exp-current"
                              checked={experienceForm.is_current}
                              onChange={() => handleCurrentToggle(true)}
                              className={styles.modernCheckbox}
                            />
                            <label htmlFor="exp-current">Trabajo actual</label>
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-align-left"></i>
                          Descripción y Responsabilidades
                        </h4>
                        <div className={styles.formGroup}>
                          <label className={styles.fixedLabel} htmlFor="exp-description">
                            <i className="fas fa-file-text"></i>
                            Descripción del puesto
                          </label>
                          <div className={styles.textareaContainer}>
                            <textarea
                              id="exp-description"
                              name="description"
                              value={experienceForm.description}
                              onChange={handleExperienceChange}
                              className={`${styles.modernTextarea} ${getValidationClasses('description')}`}
                              rows={5}
                              maxLength={500}
                              placeholder="Describe tus responsabilidades, logros y proyectos destacados en este puesto..."
                            />
                            <div className={`${styles.characterCounter} ${
                              experienceForm.description.length > 450 ? styles.warning : 
                              experienceForm.description.length > 480 ? styles.error : ''
                            }`}>
                              {experienceForm.description.length}/500 caracteres
                            </div>
                            {touchedFields.description && validationErrors.description && (
                              <div className={styles.errorMessage}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {validationErrors.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tecnologías */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-code"></i>
                          Tecnologías y Herramientas
                        </h4>
                        <div className={styles.formGroup}>
                          <label className={styles.fixedLabel}>
                            <i className="fas fa-tools"></i>
                            Tecnologías utilizadas
                          </label>
                          <div className={styles.chipsContainer} style={{ position: 'relative' }}>
                            <input
                              ref={technologyInputRef}
                              type="text"
                              value={technologyInput}
                              onChange={handleTechnologyInputChange}
                              onKeyDown={handleTechnologyKeyDown}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              onFocus={() => setShowSuggestions(technologyInput.length > 0)}
                              className={styles.chipsInput}
                              placeholder="Escribe y presiona Enter para agregar tecnologías..."
                            />
                            {experienceForm.technologies.length > 0 && (
                              <div className={styles.chipsList}>
                                {experienceForm.technologies.map((tech, index) => (
                                  <span key={index} className={styles.chip}>
                                    {tech}
                                    <button
                                      type="button"
                                      onClick={() => handleTechnologyRemove(index)}
                                      className={styles.chipRemove}
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Sugerencias */}
                            {showSuggestions && getFilteredSuggestions().length > 0 && (
                              <div ref={suggestionsRef} className={styles.chipsSuggestions}>
                                {getFilteredSuggestions().map((suggestion, index) => (
                                  <div
                                    key={suggestion}
                                    className={`${styles.suggestionItem} ${
                                      index === suggestionsIndex ? styles.highlighted : ''
                                    }`}
                                    onClick={() => handleTechnologyAdd(suggestion)}
                                  >
                                    {suggestion}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Formulario de Educación */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-info-circle"></i>
                          Información Básica
                        </h4>
                        <div className={`${styles.formGrid} ${styles.twoColumns}`}>
                          <div className={styles.formGroup}>
                            <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="edu-title">
                              <i className="fas fa-graduation-cap"></i>
                              Título o Grado
                            </label>
                            <input
                              type="text"
                              id="edu-title"
                              name="title"
                              value={educationForm.title}
                              onChange={handleEducationChange}
                              className={`${styles.modernInput} ${getValidationClasses('title')}`}
                              required
                              placeholder="Ej: Grado en Ingeniería Informática"
                            />
                            {touchedFields.title && validationErrors.title && (
                              <div className={styles.errorMessage}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {validationErrors.title}
                              </div>
                            )}
                          </div>
                          <div className={styles.formGroup}>
                            <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="edu-institution">
                              <i className="fas fa-university"></i>
                              Institución
                            </label>
                            <input
                              type="text"
                              id="edu-institution"
                              name="institution"
                              value={educationForm.institution}
                              onChange={handleEducationChange}
                              className={`${styles.modernInput} ${getValidationClasses('institution')}`}
                              required
                              placeholder="Ej: Universidad Tecnológica"
                            />
                            {touchedFields.institution && validationErrors.institution && (
                              <div className={styles.errorMessage}>
                                <i className="fas fa-exclamation-triangle"></i>
                                {validationErrors.institution}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Período de tiempo */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-calendar-alt"></i>
                          Período de Tiempo
                        </h4>
                        <div className={styles.dateRangeContainer}>
                          <div className={styles.dateRangePicker}>
                            <div className={styles.formGroup}>
                              <label className={`${styles.fixedLabel} ${styles.required}`} htmlFor="edu-start">
                                <i className="fas fa-play"></i>
                                Fecha de inicio
                              </label>
                              <input
                                type="month"
                                id="edu-start"
                                name="start_date"
                                value={educationForm.start_date}
                                onChange={handleEducationChange}
                                className={styles.modernInput}
                                required
                              />
                            </div>
                            <div className={styles.dateRangeSeparator}>
                              <i className="fas fa-arrow-right"></i>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.fixedLabel} htmlFor="edu-end">
                                <i className="fas fa-stop"></i>
                                Fecha de fin
                              </label>
                              <input
                                type="month"
                                id="edu-end"
                                name="end_date"
                                value={educationForm.end_date}
                                onChange={handleEducationChange}
                                className={styles.modernInput}
                                disabled={educationForm.is_current}
                                placeholder={educationForm.is_current ? "En curso" : ""}
                              />
                            </div>
                          </div>
                          <div className={styles.currentToggle}>
                            <input
                              type="checkbox"
                              id="edu-current"
                              checked={educationForm.is_current}
                              onChange={() => handleCurrentToggle(false)}
                              className={styles.modernCheckbox}
                            />
                            <label htmlFor="edu-current">Estudios en curso</label>
                          </div>
                        </div>
                      </div>

                      {/* Calificación y descripción */}
                      <div className={styles.formSection}>
                        <h4 className={styles.sectionTitle}>
                          <i className="fas fa-medal"></i>
                          Detalles Académicos
                        </h4>
                        <div className={styles.formGrid}>
                          <div className={styles.formGroup}>
                            <label className={styles.fixedLabel} htmlFor="edu-grade">
                              <i className="fas fa-star"></i>
                              Calificación
                            </label>
                            <input
                              type="text"
                              id="edu-grade"
                              name="grade"
                              value={educationForm.grade}
                              onChange={handleEducationChange}
                              className={styles.modernInput}
                              placeholder="Ej: Sobresaliente, 8.5/10, Matrícula de Honor"
                            />
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.fixedLabel} htmlFor="edu-description">
                            <i className="fas fa-file-text"></i>
                            Descripción
                          </label>
                          <div className={styles.textareaContainer}>
                            <textarea
                              id="edu-description"
                              name="description"
                              value={educationForm.description}
                              onChange={handleEducationChange}
                              className={styles.modernTextarea}
                              rows={4}
                              maxLength={500}
                              placeholder="Describe la especialización, proyectos destacados, etc..."
                            />
                            <div className={styles.characterCounter}>
                              {educationForm.description.length}/500 caracteres
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </form>

                {/* Footer sticky con acciones */}
                <div className={styles.stickyFooter}>
                  <div className={styles.saveIndicator}>
                    {saving && (
                      <>
                        <i className={`fas fa-spinner ${styles.loadingSpinner}`}></i>
                        Guardando cambios...
                      </>
                    )}
                  </div>
                  <div className={styles.formActions}>
                    <button 
                      type="button" 
                      className={`${styles.modernBtn} ${styles.secondary}`}
                      onClick={handleCloseForm}
                      disabled={saving}
                    >
                      <i className="fas fa-times"></i>
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className={`${styles.modernBtn} ${styles.primary}`}
                      disabled={saving}
                      onClick={handleSubmit}
                    >
                      {saving ? (
                        <>
                          <i className={`fas fa-spinner ${styles.loadingSpinner}`}></i>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          {editingId ? "Guardar Cambios" : `Crear ${editingType === "experience" ? "Experiencia" : "Educación"}`}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

export default ExperienceAdmin;
