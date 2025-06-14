// src/components/sections/articles/ArticlesSection.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getArticles } from "../../../services/api";
import type { Article } from "../../../services/api";
import FloatingActionButton from "../../common/FloatingActionButton";
import HeaderSection from "../header/HeaderSection";
import styles from "./ArticlesSection.module.css";

interface ArticlesSectionProps {
  onArticleClick?: (articleId: number) => void;
  showAdminButton?: boolean;
  onAdminClick?: () => void;
}

const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  onArticleClick,
  showAdminButton = false,
  onAdminClick,
}) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getArticles();
      setArticles(data);
    } catch (err) {
      setError("Error al cargar los proyectos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (articleId: number) => {
    if (onArticleClick) {
      onArticleClick(articleId);
    } else {
      // Navegar a la página independiente del artículo
      navigate(`/article/${articleId}`);
    }
  };

  const handleAdminClick = () => {
    // Navegar a la página de administración de artículos
    navigate('/articles/admin');
    onAdminClick?.(); // Llamar al callback original si existe
  };

  if (loading) {
    return (
      <section className={styles.articlesSection}>
        <HeaderSection 
          icon="fas fa-project-diagram" 
          title="Proyectos Destacados" 
          subtitle="Una selección de mis proyectos más relevantes y sus tecnologías" 
          className="articles" 
        />
        <div className="section-container">
          <div className={styles.articlesGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={styles.articleCardSkeleton}>
                <div className={styles.skeletonImage}></div>
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonBadges}>
                    <div className={styles.skeletonBadge}></div>
                    <div className={styles.skeletonBadge}></div>
                  </div>
                  <div className={styles.skeletonTitle}></div>
                  <div className={styles.skeletonDescription}>
                    <div className={styles.skeletonLine}></div>
                    <div className={styles.skeletonLine}></div>
                  </div>
                  <div className={styles.skeletonTechs}>
                    <div className={styles.skeletonTech}></div>
                    <div className={styles.skeletonTech}></div>
                    <div className={styles.skeletonTech}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  if (error) {
    return (      <section className={styles.articlesSection}>
        <HeaderSection 
          icon="fas fa-project-diagram" 
          title="Proyectos Destacados" 
          subtitle="Una selección de mis proyectos más relevantes y sus tecnologías" 
          className="articles" 
        />
        <div className={styles.articlesError}>
          <p>{error}</p>
          <button onClick={loadArticles} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }  if (articles.length === 0) {
    return (
      <section className={styles.articlesSection}>
        <HeaderSection 
          icon="fas fa-project-diagram" 
          title="Proyectos Destacados" 
          subtitle="Una selección de mis proyectos más relevantes y sus tecnologías" 
          className="articles" 
        />
        <div className={styles.articlesEmpty}>
          <i className="fas fa-project-diagram"></i>
          <p>No hay proyectos publicados aún.</p>
          {showAdminButton && (
            <button onClick={handleAdminClick} className={styles.adminButton}>
              <i className="fas fa-plus"></i> Crear primer proyecto
            </button>
          )}
        </div>      </section>
    );
  }

  return (
    <section className="section-cv">
      <HeaderSection 
        icon="fas fa-project-diagram" 
        title="Proyectos Destacados" 
        subtitle="Una selección de mis proyectos más relevantes y sus tecnologías" 
        className="articles" 
      />
      <div className="section-container">

      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <article
            key={article.id}
            className={styles.articleCard}
            onClick={() => handleArticleClick(article.id)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleArticleClick(article.id);
              }
            }}
          >
            {article.image_url && (
              <div className={styles.articleImage}>
                <img
                  src={article.image_url}
                  alt={article.title}
                  loading="lazy"
                />
                <div 
                  className={styles.articleOverlay}
                  data-tooltip="Ver proyecto completo"
                  role="button"
                  tabIndex={-1}
                  aria-label="Abrir proyecto"
                >
                  <i className="fas fa-newspaper" aria-hidden="true"></i>
                </div>
              </div>
            )}

            <div className={styles.articleContent}>
              {/* Badge del tipo de contenido */}
              <div className={styles.articleTypeContainer}>
                {article.article_content ? (
                  <span 
                    className={`${styles.articleBadge} ${styles.articleTypeBadge}`}
                    role="badge"
                    aria-label="Tipo de contenido: Artículo"
                  >
                    <i className="fas fa-newspaper" aria-hidden="true"></i>
                    Artículo
                  </span>
                ) : (
                  <span 
                    className={`${styles.articleBadge} ${styles.projectTypeBadge}`}
                    role="badge"
                    aria-label="Tipo de contenido: Proyecto"
                  >
                    <i className="fas fa-code" aria-hidden="true"></i>
                    Proyecto
                  </span>
                )}
                
                {/* Badge de estado */}
                <span 
                  className={`${styles.articleBadge} ${styles.articleStatus}`}
                  data-status={article.status}
                  role="badge"
                  aria-label={`Estado del proyecto: ${article.status}`}
                >
                  {article.status === 'Completado' ? 'COMPLETADO' : 
                   article.status === 'En Desarrollo' ? 'EN DESARROLLO' : 'BORRADOR'}
                </span>
              </div>

              {/* Meta información: fechas y visitas */}
              <div className={styles.articleMeta}>
                <div className={styles.articleDates}>
                  {article.project_start_date && article.project_end_date ? (
                    <time 
                      className={styles.articleDate}
                      dateTime={article.project_start_date}
                      title={`Proyecto desarrollado desde ${new Date(article.project_start_date).toLocaleDateString('es-ES')} hasta ${new Date(article.project_end_date).toLocaleDateString('es-ES')}`}
                    >
                      {(() => {
                        const startDate = new Date(article.project_start_date);
                        const endDate = new Date(article.project_end_date);
                        const startYear = startDate.getFullYear();
                        const endYear = endDate.getFullYear();
                        
                        // Si es el mismo año, mostrar meses
                        if (startYear === endYear) {
                          return `${startDate.toLocaleDateString('es-ES', { month: 'short' })} - ${endDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`;
                        }
                        // Si son años diferentes, mostrar años
                        return `${startYear} - ${endYear}`;
                      })()}
                    </time>
                  ) : article.project_start_date ? (
                    <time 
                      className={styles.articleDate}
                      dateTime={article.project_start_date}
                      title={`Proyecto iniciado en ${new Date(article.project_start_date).toLocaleDateString('es-ES')}`}
                    >
                      Desde {new Date(article.project_start_date).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </time>
                  ) : article.created_at ? (
                    <time 
                      className={styles.articleDate}
                      dateTime={article.created_at}
                      title={`Publicado el ${new Date(article.created_at).toLocaleDateString('es-ES')}`}
                    >
                      {new Date(article.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short', 
                        year: 'numeric'
                      })}
                    </time>
                  ) : (
                    <span className={styles.articleDate}>Fecha no disponible</span>
                  )}
                </div>
                <span className={styles.articleViews} aria-label={`Número de visitas: ${article.views || 0}`}>
                  <i className="fas fa-eye" aria-hidden="true"></i>
                  {article.views || 0}
                </span>
              </div>

              {/* Título del proyecto */}
              <h3 className={styles.articleTitle}>{article.title}</h3>
              
              {/* Descripción breve */}
              <p className={styles.articleDescription}>{article.description}</p>

              {/* Tecnologías utilizadas */}
              {article.technologies && article.technologies.length > 0 && (
                <div className={styles.articleTechnologies}>
                  {article.technologies.slice(0, 4).map((tech, idx) => (
                    <span key={idx} className={styles.techChip}>
                      {tech}
                    </span>
                  ))}
                  {article.technologies.length > 4 && (
                    <span className={styles.techMore}>
                      +{article.technologies.length - 4}
                    </span>
                  )}
                </div>
              )}
              {/* Enlaces del proyecto */}
              <div className={styles.articleLinks}>
                {article.github_url && (
                  <a
                    href={article.github_url}
                    className={`${styles.articleLink} ${styles.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Ver repositorio en GitHub"
                  >
                    <i className="fab fa-github"></i>
                  </a>
                )}
                {article.live_url && article.live_url !== "#" && (
                  <a
                    href={article.live_url}
                    className={`${styles.articleLink} ${styles.demo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Ver demo en vivo"
                  >
                    <i className="fas fa-eye"></i>
                  </a>
                )}
                {article.video_demo_url && (
                  <a
                    href={article.video_demo_url}
                    className={`${styles.articleLink} ${styles.video}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Ver video demostración"
                  >
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
              </div>

              <div className={styles.articleActions}>
                <span className={styles.readMore}>
                  Ver proyecto completo <i className="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>
          </article>        ))}
      </div>
      </div>

      {/* Floating Action Button para administración */}
      {showAdminButton && (
        <FloatingActionButton
          onClick={handleAdminClick}
          icon="fas fa-edit"
          label="Gestionar Proyectos"
          color="primary"
          position="bottom-right"
        />
      )}
    </section>
  );
};

export default ArticlesSection;
