import React, { useState, useEffect } from "react";
import { getCertifications, createCertification, updateCertification, deleteCertification, type Certification as APICertification } from "../../../services/api";
import { useNotification } from "../../../hooks/useNotification";
import HeaderSection from "../header/HeaderSection";
import AdminModal from "../../ui/AdminModal";
import DatePicker from "../../ui/DatePicker";
import IssuerSelector from "../../ui/IssuerSelector";
import CredentialIdInput from "../../ui/CredentialIdInput";
import FloatingActionButtonGroup from "../../common/FloatingActionButtonGroup";
import { type CertificationIssuer, generateVerifyUrl, generateCertificateImageUrl, ISSUER_CATEGORIES } from "../../../data/certificationIssuers";
import styles from "./CertificationsSection.module.css";
import modalStyles from "./CertificationsModal.module.css";

// Interfaz local para el componente con nombres amigables
interface Certification {
  id: number;
  title: string;
  issuer: string;
  date: string;
  credentialId?: string;
  image: string;
  verifyUrl?: string;
}

interface CertificationsSectionProps {
  isAdminMode?: boolean;
  showAdminFAB?: boolean;
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ 
  isAdminMode = false,
  showAdminFAB = false
}) => {  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);  const { showSuccess, showError } = useNotification();
  
  const [form, setForm] = useState({
    title: "",
    issuer: "",
    date: "",
    credential_id: "",
    image_url: "",
    order_index: 0,
  });
  const [selectedIssuer, setSelectedIssuer] = useState<CertificationIssuer | null>(null);

  const emptyForm = {
    title: "",
    issuer: "",
    date: "",
    credential_id: "",
    image_url: "",
    order_index: 0,
  };  const loadCertifications = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carga de certificaciones...");
      const data = await getCertifications();
      console.log("Datos recibidos de la API:", data);
      
      // Mapear los campos de la API a la interfaz del componente
      const mappedData: Certification[] = data.map((cert: APICertification) => ({
        id: cert.id,
        title: cert.title,
        issuer: cert.issuer,
        date: cert.date,
        credentialId: cert.credential_id,
        image: cert.image_url || '/assets/images/foto-perfil.jpg',
        verifyUrl: cert.verify_url // Incluir la URL de verificación de la base de datos
      }));
      
      console.log("Datos mapeados:", mappedData);
      setCertifications(mappedData);
    } catch (error) {
      console.error("Error cargando certificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertifications();
  }, []);  const handleAdminModalClose = () => {
    setShowAdminModal(false);
    // Recargar certificaciones después de cerrar el modal admin
    loadCertifications();
  };

  // Funciones de administración
  const handleCertificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ 
      ...prev, 
      [name]: name === "order_index" ? parseInt(value) || 0 : value 
    }));
  };

  const handleDateChange = (value: string) => {
    setForm(prev => ({ ...prev, date: value }));
  };

  const handleIssuerChange = (issuer: CertificationIssuer) => {
    if (issuer.name) {
      setSelectedIssuer(issuer);
      setForm(prev => ({ 
        ...prev, 
        issuer: issuer.name,
        // Auto-mapear la imagen del logo del emisor
        image_url: issuer.logoUrl || prev.image_url
      }));
      
      // Si ya hay un credential_id, generar URLs automáticamente
      if (form.credential_id && form.credential_id.trim()) {
        // Generar URL de verificación
        if (issuer.verifyBaseUrl) {
          const verifyUrl = generateVerifyUrl(issuer, form.credential_id);
          if (verifyUrl) {
            setForm(prev => ({ ...prev, verify_url: verifyUrl }));
          }
        }
        
        // Generar URL de imagen del certificado si está disponible
        if (issuer.certificateImageUrl) {
          const certificateImageUrl = generateCertificateImageUrl(issuer, form.credential_id);
          if (certificateImageUrl) {
            setForm(prev => ({ ...prev, image_url: certificateImageUrl }));
          }
        }
      }
    } else {
      // Limpieza cuando se vacía el selector
      setSelectedIssuer(null);
      setForm(prev => ({ 
        ...prev, 
        issuer: "",
        image_url: "",
        verify_url: ""
      }));
    }
  };

  const handleCertificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.issuer.trim() || !form.date.trim()) {
      showError("Error de validación", "Título, emisor y fecha son obligatorios");
      return;
    }

    try {
      setSaving(true);
      
      // Generar URLs automáticamente si hay emisor seleccionado y credential_id
      let verifyUrl = "";
      let imageUrl = form.image_url; // Usar la imagen actual por defecto
      
      if (selectedIssuer && form.credential_id.trim()) {
        // Generar URL de verificación
        const generatedVerifyUrl = generateVerifyUrl(selectedIssuer, form.credential_id);
        if (generatedVerifyUrl) {
          verifyUrl = generatedVerifyUrl;
        }
        
        // Generar URL de imagen del certificado si está disponible
        if (selectedIssuer.certificateImageUrl) {
          const certificateImageUrl = generateCertificateImageUrl(selectedIssuer, form.credential_id);
          if (certificateImageUrl) {
            imageUrl = certificateImageUrl;
          }
        }
      } else if (selectedIssuer && !form.credential_id.trim()) {
        // Si hay emisor pero no credential_id, usar el logo del emisor
        imageUrl = selectedIssuer.logoUrl || form.image_url;
      }
      
      const certificationData = {
        ...form,
        image_url: imageUrl,
        verify_url: verifyUrl || undefined,
        user_id: 1,
        order_index: form.order_index || certifications.length,
      };

      if (editingId) {
        await updateCertification(editingId, certificationData);
        showSuccess("Certificación actualizada", "Los cambios se han guardado correctamente");
      } else {
        await createCertification(certificationData);
        showSuccess("Certificación creada", "La nueva certificación se ha añadido correctamente");
      }

      await loadCertifications();
      handleCloseForm();
    } catch (error) {
      console.error("Error guardando certificación:", error);
      showError("Error", "No se pudo guardar la certificación");
    } finally {
      setSaving(false);
    }
  };
  const handleEditCertification = (cert: APICertification) => {
    console.log("🔧 handleEditCertification called with:", cert);
    setForm({
      title: cert.title,
      issuer: cert.issuer,
      date: cert.date,
      credential_id: cert.credential_id || "",
      image_url: cert.image_url || "",
      order_index: cert.order_index,
    });
    setEditingId(cert.id);
    setShowForm(true);
    console.log("🔧 handleEditCertification - Form set, showForm set to true");
  };

  const handleDeleteCertification = async (id: number, title: string) => {
    console.log("🔧 handleDeleteCertification called with:", id, title);
    
    if (!confirm(`¿Estás seguro de eliminar la certificación "${title}"?`)) {
      console.log("🔧 handleDeleteCertification - User cancelled");
      return;
    }

    try {
      console.log("🔧 handleDeleteCertification - Deleting...");
      await deleteCertification(id);
      showSuccess("Certificación eliminada", "La certificación se ha eliminado correctamente");
      await loadCertifications();
      console.log("🔧 handleDeleteCertification - Successfully deleted and reloaded");
    } catch (error) {
      console.error("Error eliminando certificación:", error);
      showError("Error", "No se pudo eliminar la certificación");
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    setSelectedIssuer(null);
  };
  const handleNewCertification = () => {
    console.log("🔧 handleNewCertification - Button clicked!");
    console.log("🔧 handleNewCertification - Current certifications.length:", certifications.length);
    setForm({
      ...emptyForm,
      order_index: certifications.length,
    });
    setEditingId(null);
    setSelectedIssuer(null);
    setShowForm(true);
    console.log("🔧 handleNewCertification - showForm set to true");
  };

  const renderCertificationsList = () => {
    if (certifications.length === 0) {
      return (        <div className={modalStyles.adminEmpty}>
          <i className="fas fa-certificate"></i>
          <h3>No hay certificaciones</h3>
          <p>Añade la primera certificación usando el botón flotante.</p>
        </div>
      );
    }

    return (
      <div className={modalStyles.adminItemsList}>
        {certifications.map((cert) => (
          <div key={cert.id} className={modalStyles.adminItemCard}>            <div className={modalStyles.adminItemHeader}>
              <div className={modalStyles.adminItemImage}>
                {cert.image ? (
                  <img
                    src={cert.image}
                    alt={cert.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/foto-perfil.jpg';
                    }}
                  />
                ) : (
                  <div className={modalStyles.adminPlaceholderImage}>
                    <i className="fas fa-certificate"></i>
                  </div>
                )}
              </div>
              
              <div className={modalStyles.adminItemInfo}>
                <h3>{cert.title}</h3>
                <p className={modalStyles.adminItemSubtitle}>{cert.issuer}</p>
                
                <div className={modalStyles.adminCertMetadata}>
                  <div className={modalStyles.adminItemDate}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>{cert.date}</span>
                  </div>
                  {cert.credentialId && (
                    <div className={modalStyles.adminItemCredential}>
                      <i className="fas fa-id-card"></i>
                      <span>ID: {cert.credentialId}</span>
                    </div>
                  )}
                  {cert.verifyUrl && (
                    <div className={modalStyles.adminItemVerify}>
                      <a 
                        href={cert.verifyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={modalStyles.adminVerifyLink}
                        title="Verificar certificación"
                      >
                        <i className="fas fa-external-link-alt"></i>
                        <span>Verificar</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
              <div className={modalStyles.adminItemActions}>
              <button 
                className={modalStyles.adminBtnSecondary}
                onClick={() => {
                  console.log("🔧 Edit button clicked for cert:", cert);
                  handleEditCertification({
                    id: cert.id,
                    title: cert.title,
                    issuer: cert.issuer,
                    date: cert.date,
                    credential_id: cert.credentialId || "",
                    image_url: cert.image || "",
                    verify_url: cert.verifyUrl || "",
                    order_index: cert.id,
                    user_id: 1
                  });
                }}
              >
                <i className="fas fa-edit"></i>
                Editar
              </button>
              <button
                className={modalStyles.adminBtnDanger}
                onClick={() => {
                  console.log("🔧 Delete button clicked for cert:", cert.id, cert.title);
                  handleDeleteCertification(cert.id, cert.title);
                }}
              >
                <i className="fas fa-trash"></i>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };  const renderCertificationForm = () => {
    return (
      <div>        
        <form onSubmit={handleCertificationSubmit} className={`${modalStyles.adminForm} admin-form`}>
          <div className={modalStyles.adminFormRow}>
            <div className={modalStyles.adminFormGroup}>
              <label htmlFor="cert-title">Título *</label>
              <input
                type="text"
                id="cert-title"
                name="title"
                value={form.title}
                onChange={handleCertificationChange}
                required
                placeholder="Ej: AWS Solutions Architect"
              />
            </div>
            <div className={modalStyles.adminFormGroup}>
              <label htmlFor="cert-issuer">Emisor *</label>
              <IssuerSelector
                id="cert-issuer"
                name="issuer"
                value={form.issuer}
                onChange={handleIssuerChange}
                required
                placeholder="Buscar o seleccionar emisor..."
              />
            </div>
          </div>

          <div className={modalStyles.adminFormRow}>
            <div className={modalStyles.adminFormGroup}>
              <label htmlFor="cert-date">Fecha *</label>
              <DatePicker
                id="cert-date"
                name="date"
                value={form.date}
                onChange={handleDateChange}
                required
                placeholder="Seleccionar fecha de emisión"
              />
            </div>
            <div className={modalStyles.adminFormGroup}>
              <label htmlFor="cert-credential">ID de Credencial</label>
              <CredentialIdInput
                value={form.credential_id}
                onChange={(value) => {
                  setForm(prev => ({ ...prev, credential_id: value }));
                  
                  // Auto-generar URLs cuando cambia el credential_id
                  if (selectedIssuer && value.trim()) {
                    // Generar URL de verificación
                    if (selectedIssuer.verifyBaseUrl) {
                      const verifyUrl = generateVerifyUrl(selectedIssuer, value);
                      if (verifyUrl) {
                        setForm(prev => ({ ...prev, verify_url: verifyUrl }));
                      }
                    }
                    
                    // Generar URL de imagen del certificado si está disponible
                    if (selectedIssuer.certificateImageUrl) {
                      const certificateImageUrl = generateCertificateImageUrl(selectedIssuer, value);
                      if (certificateImageUrl) {
                        setForm(prev => ({ ...prev, image_url: certificateImageUrl }));
                      }
                    }
                  } else if (!value.trim()) {
                    // Limpiar URLs si se borra el credential_id
                    setForm(prev => ({ 
                      ...prev, 
                      verify_url: "",
                      // Solo resetear a logo del emisor si hay emisor seleccionado
                      image_url: selectedIssuer?.logoUrl || ""
                    }));
                  }
                }}
                issuer={selectedIssuer}
                placeholder="ID de credencial"
              />
            </div>
          </div>

          {/* Mostrar información del emisor seleccionado */}
          {selectedIssuer && (
            <div className={modalStyles.issuerPreview}>
              <div className={modalStyles.previewHeader}>
                <i className="fas fa-eye"></i>
                <span>Vista previa del emisor seleccionado</span>
              </div>
              <div className={modalStyles.previewContent}>
                <div className={modalStyles.previewLogo}>
                  <img 
                    src={selectedIssuer.logoUrl} 
                    alt={`${selectedIssuer.name} logo`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.logo-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'logo-fallback';
                        fallback.innerHTML = '<i class="fas fa-certificate"></i>';
                        fallback.style.cssText = `
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          width: 100%;
                          height: 100%;
                          color: var(--md-sys-color-on-surface-variant);
                          font-size: 1.5rem;
                          opacity: 0.7;
                        `;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div className={modalStyles.previewInfo}>
                  <div className={modalStyles.previewName}>{selectedIssuer.name}</div>
                  {selectedIssuer.description && (
                    <div className={modalStyles.previewDescription}>{selectedIssuer.description}</div>
                  )}
                  <div className={modalStyles.previewDetails}>
                    <span className={modalStyles.previewCategory}>
                      <i className="fas fa-tag"></i>
                      {ISSUER_CATEGORIES.find(cat => cat.id === selectedIssuer.category)?.name || selectedIssuer.category}
                    </span>
                    {selectedIssuer.verifyBaseUrl && (
                      <span className={modalStyles.previewVerify}>
                        <i className="fas fa-shield-check"></i>
                        Verificación automática disponible
                      </span>
                    )}
                    {selectedIssuer.logoUrl && (
                      <span className={modalStyles.previewCategory} style={{background: 'var(--md-sys-color-tertiary-container)', color: 'var(--md-sys-color-on-tertiary-container)'}}>
                        <i className="fas fa-image"></i>
                        Logo automático
                      </span>
                    )}
                    {selectedIssuer.certificateImageUrl && (
                      <span className={modalStyles.previewVerify} style={{background: 'var(--md-sys-color-success-container)', color: 'var(--md-sys-color-on-success-container)'}}>
                        <i className="fas fa-certificate"></i>
                        Imagen de certificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </form>
      </div>
    );
  };const renderAdminContent = () => {
    console.log("🔧 AdminModal - Rendering content...");
    console.log("🔧 AdminModal - loading:", loading);
    console.log("🔧 AdminModal - showForm:", showForm);
    console.log("🔧 AdminModal - certifications.length:", certifications.length);
    console.log("🔧 AdminModal - certifications:", certifications);
    
    if (loading) {
      console.log("🔧 AdminModal - Mostrando loading...");
      return (
        <div className={modalStyles.adminLoading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando certificaciones...</p>
        </div>
      );
    }
    
    if (showForm) {
      console.log("🔧 AdminModal - Mostrando formulario...");
      return renderCertificationForm();
    }
    
    console.log("🔧 AdminModal - Mostrando lista...");
    return renderCertificationsList();
  };

  return (
    <section className="section-cv" id="certifications">
      <HeaderSection 
        icon="fas fa-certificate" 
        title="Certificaciones" 
        subtitle="Credenciales y certificaciones profesionales obtenidas"
        className="certifications"
      />      
      <div className="section-container">
      
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando certificaciones...</p>
          </div>
        </div>
      ) : (
        <div className={styles.sectionContainer}>
          <div className={styles.certificationsGrid}>
            {certifications.map((cert, index) => (
              <div 
                key={cert.id} 
                className={styles.certificationCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.certImage}>
                  <img
                    src={cert.image}
                    alt={cert.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0zMiAyMEwyNiAyNkgzOEwzMiAyMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHBhdGggZD0iTTQ0IDM4SDIwVjQySDQ0VjM4WiIgZmlsbD0iIzlDQTRBRiIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>
                
                <div className={styles.certContent}>
                  <h3 className={styles.certTitle}>{cert.title}</h3>
                  <p className={styles.certIssuer}>{cert.issuer}</p>
                  
                  <div className={styles.certDetails}>
                    <div className={styles.certDate}>
                      <i className="fas fa-calendar-alt"></i>
                      <span>{cert.date}</span>
                    </div>
                    {cert.credentialId && (
                      <div className={styles.certId}>
                        <i className="fas fa-id-badge"></i>
                        <span>ID: {cert.credentialId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.certActions}>
                    {cert.verifyUrl ? (
                      <a 
                        href={cert.verifyUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.certVerifyBtn}
                        title="Verificar certificación"
                      >
                        <i className="fas fa-check-circle"></i>
                        <span>Verificar</span>
                      </a>
                    ) : (
                      <button className={styles.certVerifyBtn} title="Verificar certificación">
                        <i className="fas fa-check-circle"></i>
                        <span>Verificar</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className={styles.certBadge}>
                  <i className="fas fa-award"></i>
                </div>
              </div>
            ))}
          </div>
          
          {certifications.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-certificate"></i>
              </div>
              <h3 className={styles.emptyTitle}>No hay certificaciones disponibles</h3>
              <p className={styles.emptyDescription}>
                Las certificaciones aparecerán aquí cuando estén disponibles.
              </p>
            </div>
          )}
        </div>
      )}      {/* Floating Action Buttons para certificaciones */}
      {!isAdminMode && showAdminFAB && (
        <FloatingActionButtonGroup
          actions={[
            {
              id: "admin-certifications",
              onClick: () => {
                console.log('Admin button clicked');
                setShowAdminModal(true);
              },
              icon: "fas fa-shield-alt",
              label: "Administrar Certificaciones",
              color: "primary"
            },
            {
              id: "add-certification",
              onClick: () => {
                console.log('Add certification button clicked');
                setShowForm(true);
                setShowAdminModal(true);
                handleNewCertification();
              },
              icon: "fas fa-plus",
              label: "Añadir Certificación",
              color: "success"
            }
          ]}
          position="bottom-right"
        />
      )}
      </div>

      {/* Modal de administración */}
      {showAdminModal && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={handleAdminModalClose}
          title="Administrar Certificaciones"
          icon="fas fa-certificate"
          tabs={[
            {
              id: "list",
              label: "Listado",
              icon: "fas fa-list",
              content: null,
              badge: certifications.length.toString()
            },
            {
              id: "form",
              label: showForm && editingId ? "Editar" : "Nueva",
              icon: showForm && editingId ? "fas fa-edit" : "fas fa-plus",
              content: null,
              disabled: !showForm
            }
          ]}
          activeTab={showForm ? "form" : "list"}
          onTabChange={(tabId: string) => {
            if (tabId === "list" && showForm) {
              // Si estamos en el formulario y cambiamos a la lista
              setShowForm(false);
            } else if (tabId === "form" && !showForm) {
              // Si estamos en la lista y cambiamos al formulario, crear nueva certificación
              handleNewCertification();
            }
          }}
          showTabs={true}
          floatingActions={showForm ? [
            {
              id: "cancel-cert",
              label: "Cancelar",
              icon: "fas fa-times",
              variant: "secondary",
              onClick: () => setShowForm(false)
            },
            {
              id: "save-cert",
              label: saving ? "Guardando..." : (editingId ? "Guardar Cambios" : "Crear Certificación"),
              icon: saving ? "fas fa-spinner fa-spin" : "fas fa-save",
              variant: "primary",
              onClick: () => {
                const form = document.querySelector('.admin-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              },
              disabled: saving,
              loading: saving
            }
          ] : [
            {
              id: "new-cert",
              label: "Nueva Certificación",
              icon: "fas fa-plus",
              variant: "primary",
              onClick: handleNewCertification
            }
          ]}
        >
          <div className={modalStyles.adminModalContent}>
            {renderAdminContent()}
          </div>
        </AdminModal>
      )}
    </section>
  );
};

export default CertificationsSection;
