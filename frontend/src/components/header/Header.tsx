import { useEffect, useState } from "react";
import usePDFExport from "../../hooks/usePDFExport";
import { getUserProfile } from "../../services/api";
import type { UserProfile } from "../../services/api";
import LazyImage from "../ui/LazyImage";
import { useHeader } from "../../hooks/useHeader";

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode?: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, onToggleDarkMode }) => {
  const { exportToPDF } = usePDFExport();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar el hook optimizado de header
  const { state, actions, elementRef } = useHeader({
    profileName: profile?.name,
    darkMode,
    onToggleDarkMode,
    exportToPDF,
  });
  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar el perfil.");
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    // Verificar que Font Awesome esté cargado
    const checkFontAwesome = () => {
      const testIcon = document.createElement("i");
      testIcon.className = "fa-brands fa-linkedin";
      testIcon.style.visibility = "hidden";
      testIcon.style.position = "absolute";
      testIcon.style.fontFamily = "Font Awesome 6 Brands";
      document.body.appendChild(testIcon);

      const styles = window.getComputedStyle(testIcon, ":before");
      const content = styles.getPropertyValue("content");

      document.body.removeChild(testIcon);

      console.log("Font Awesome content detected:", content);

      if (content && content !== "none" && content !== '""') {
        console.log("✅ Font Awesome cargado correctamente");
      } else {
        console.warn("⚠️ Font Awesome no está cargado correctamente");
        console.log("Probando URL de Font Awesome...");

        // Verificar si la URL de Font Awesome está accesible
        fetch(
          "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        )
          .then((response) =>
            console.log("Font Awesome CDN status:", response.status)
          )
          .catch((error) =>
            console.error("Error accessing Font Awesome CDN:", error)
          );
      }
    };

    // Verificar después de un pequeño delay para asegurar que Font Awesome se haya cargado
    setTimeout(checkFontAwesome, 1000);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);
  if (loading) {
    return (
      <header className="header-curriculum loading">
        <div className="header-skeleton">
          <div className="header-skeleton-content">
            <div className="header-skeleton-image"></div>
            <div className="header-skeleton-text">
              <div className="header-skeleton-line long"></div>
              <div className="header-skeleton-line medium"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (error || !profile) {
    return (
      <header className="header-curriculum error">
        <div className="header-error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error || "Error al cargar el perfil"}</span>
        </div>
      </header>
    );
  }

  return (
    <header
      ref={elementRef}
      className={`
        header-curriculum 
        ${state.isScrolled ? "scrolled" : ""} 
        ${state.isCompact ? "compact" : ""}
        ${!state.isVisible ? "hidden" : ""}
      `}
    >
      {/* Indicador de progreso de scroll */}
      <div
        className="header-scroll-progress"
        style={{ width: `${state.scrollProgress}%` }}
      />
      <div className="header-content">
        {" "}
        <div className="header-avatar-container">
          <LazyImage
            src={
              profile.profile_image?.startsWith("http")
                ? profile.profile_image
                : profile.profile_image
                ? `/${profile.profile_image.replace(/^\//, "")}`
                : "/assets/images/foto-perfil.jpg"
            }
            alt={`Foto de perfil de ${profile.name}`}
            className="header-profile-image"
            fallbackSrc="/assets/images/foto-perfil.jpg"
            onError={() => console.log("Error cargando la imagen de perfil")}
            onLoad={() => console.log("Imagen de perfil cargada exitosamente")}
          />
        </div>
        <div className="header-info">
          <div className="header-name-container">
            <h1 className="header-name-title">{profile.name}</h1>
            {profile.status && (
              <div
                className="header-status-badge-inline"
                title={
                  profile.status === "Disponible"
                    ? "🚀 Disponible para nuevas oportunidades | Incorporación inmediata"
                    : profile.status
                }
              >
                {profile.status}
              </div>
            )}
          </div>
          {profile.role_title && (
            <h2 className="header-role-title">{profile.role_title}</h2>
          )}
          {profile.role_subtitle && (
            <p className="header-role-subtitle">{profile.role_subtitle}</p>
          )}
          <div className="header-contact-info">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="header-contact-item">
                <i className="fas fa-envelope"></i> {profile.email}
              </a>
            )}
            {profile.phone && (
              <div className="header-contact-item">
                <i className="fas fa-phone"></i> {profile.phone}
              </div>
            )}
            {profile.location && (
              <div className="header-contact-item">
                <i className="fas fa-map-marker-alt"></i> {profile.location}
              </div>
            )}{" "}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                className="header-contact-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i
                  className="fa-brands fa-linkedin"
                  style={{
                    fontFamily: "Font Awesome 6 Brands",
                    fontWeight: 400,
                  }}
                ></i>{" "}
                LinkedIn
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                className="header-contact-item"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i
                  className="fa-brands fa-github"
                  style={{
                    fontFamily: "Font Awesome 6 Brands",
                    fontWeight: 400,
                  }}
                ></i>{" "}
                GitHub
              </a>
            )}
          </div>{" "}
          <div className="header-action-buttons">
            <button
              className="header-action-button primary"
              onClick={() => actions.handleDownloadPDF()}
              title="Descargar CV en formato PDF"
            >
              <i className="fas fa-download"></i> Descargar CV
            </button>
            <button
              className="header-action-button"
              onClick={() => actions.handleToggleTheme()}
              type="button"
              title={
                darkMode ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
              }
            >
              <i className={darkMode ? "fas fa-sun" : "fas fa-moon"}></i>
              {darkMode ? "Claro" : "Oscuro"}
            </button>{" "}
            <button
              className="header-action-button"
              onClick={() => actions.handleShare()}
              type="button"
              title="Compartir CV"
            >
              <i className="fas fa-share-alt"></i> Compartir
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
