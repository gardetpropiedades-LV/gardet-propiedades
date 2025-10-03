(function(){
  const grid = document.getElementById('news-grid');
  if(!grid){
    return;
  }

  const placeholderImg = 'assets/news/noticia-ventas.svg';
  grid.innerHTML = '';

  fetch('data/news.json')
    .then(function(response){
      if(!response.ok){
        throw new Error('No se pudo cargar news.json');
      }
      return response.json();
    })
    .then(function(items){
      if(!Array.isArray(items)){
        throw new Error('Formato de noticias inválido');
      }

      const publicados = items
        .filter(function(item){
          return item && item.publicado;
        })
        .sort(function(a,b){
          return new Date(b.fecha || 0) - new Date(a.fecha || 0);
        })
        .slice(0,3);

      if(publicados.length === 0){
        grid.innerHTML = '<p class="lead">Pronto tendremos noticias para compartir.</p>';
        return;
      }

      const fragment = document.createDocumentFragment();

      publicados.forEach(function(item){
        const card = document.createElement('article');
        card.className = 'card news-card';

        if(item.categoria){
          const categorySlug = item.categoria
            .toString()
            .trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g,'-')
            .replace(/^-+|-+$/g,'');
          if(categorySlug){
            card.setAttribute('data-category', categorySlug);
          }
        }

        const figure = document.createElement('figure');
        const img = document.createElement('img');
        img.src = item.imagen || placeholderImg;
        img.alt = item.titulo ? 'Imagen de ' + item.titulo : 'Imagen de noticia';
        img.loading = 'lazy';
        img.addEventListener('error', function(){
          if(this.src !== placeholderImg){
            this.src = placeholderImg;
          }
        });
        figure.appendChild(img);
        card.appendChild(figure);

        const header = document.createElement('div');
        header.className = 'news-card-head';

        if(item.icono){
          const icon = document.createElement('span');
          icon.className = 'news-card-icon';
          const img = document.createElement('img');
          img.src = item.icono;
          img.alt = '';
          img.loading = 'lazy';
          icon.appendChild(img);
          header.appendChild(icon);
        }

        const titleWrap = document.createElement('div');
        titleWrap.className = 'news-card-titlewrap';

        if(item.categoria){
          const badge = document.createElement('span');
          badge.className = 'badge badge-soft';
          badge.textContent = item.categoria;
          titleWrap.appendChild(badge);
        }

        const title = document.createElement('h3');
        title.textContent = item.titulo || 'Noticia destacada';
        titleWrap.appendChild(title);

        header.appendChild(titleWrap);
        card.appendChild(header);

        const meta = document.createElement('p');
        meta.className = 'meta';
        var metaContent = '';
        try {
          const date = item.fecha ? new Date(item.fecha) : null;
          if(date && !isNaN(date)){
            metaContent = date.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
          }
        } catch (err){
          metaContent = '';
        }
        if(metaContent){
          meta.textContent = metaContent;
          card.appendChild(meta);
        }

        if(item.resumen){
          const summary = document.createElement('p');
          summary.textContent = item.resumen;
          card.appendChild(summary);
        }

        if(item.fuente){
          const sourceLink = document.createElement('a');
          sourceLink.className = 'source';
          sourceLink.href = item.fuente;
          sourceLink.target = '_blank';
          sourceLink.rel = 'noreferrer noopener';
          sourceLink.innerHTML = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M11.667 3.333h5v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.667 8.333 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.667 3.333 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Fuente oficial';
          card.appendChild(sourceLink);
        }

        if(item.slug){
          const cta = document.createElement('a');
          cta.href = 'noticias.html#' + item.slug;
          cta.className = 'btn';
          cta.textContent = 'Leer más';
          card.appendChild(cta);
        }

        fragment.appendChild(card);
      });

      grid.appendChild(fragment);
    })
    .catch(function(error){
      console.error(error);
      grid.innerHTML = '<p class="lead">No pudimos cargar las noticias en este momento.</p>';
    });
})();
