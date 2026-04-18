---
layout: onepage-home
permalink: /
title: "Dazhi Zhao"
author_profile: false
redirect_from: 
  - /about/
  - /about.html
---

{% assign publications = site.publications | where: "show_in_publications", true | sort: "date" | reverse %}

<section class="onepage-hero" id="about">
  <div class="onepage-hero__aside">
    <div class="onepage-hero__media">
      <img src="{{ '/images/profile.png' | relative_url }}" alt="Dazhi Zhao">
    </div>

    <ul class="onepage-aside-list social-icons">
      <li class="onepage-aside-list__item">
        <a href="https://www.tongji.edu.cn/">
          <i class="fa-solid fa-building-columns icon-pad-right" aria-hidden="true"></i>
          Tongji University
        </a>
      </li>
      <li class="onepage-aside-list__item">
        <a href="https://www.linkedin.com/in/dazhizhao126/">
          <i class="fa-brands fa-linkedin icon-pad-right" aria-hidden="true"></i>
          LinkedIn
        </a>
      </li>
      <li class="onepage-aside-list__item">
        <a href="https://scholar.google.com/citations?user=kBNngDgAAAAJ&hl=en">
          <i class="ai ai-google-scholar icon-pad-right" aria-hidden="true"></i>
          Google Scholar
        </a>
      </li>
      <li class="onepage-aside-list__item onepage-aside-list__item--email">
        <span>
          <i class="fa-regular fa-envelope icon-pad-right" aria-hidden="true"></i>
          <span class="onepage-aside-list__email-text">zhaodazhi [at] tongji [dot] edu [dot] cn</span>
        </span>
      </li>
    </ul>
  </div>
  <div class="onepage-hero__body">
    <h1 class="onepage-hero__title">Dazhi Zhao 「赵大志」</h1>
    <p class="onepage-hero__subtitle">Undergraduate researcher at Tongji University</p>

    <p>I am a third-year undergraduate student at the <a href="https://aero-mech.tongji.edu.cn/">School of Aerospace Engineering and Applied Mechanics</a>, <a href="https://www.tongji.edu.cn/">Tongji University</a>.</p>

    <p class="onepage-hero__focus">
      <span class="onepage-hero__focus-label">My research interests include:</span>
      <span class="onepage-hero__focus-item"><span class="onepage-hero__focus-dot" aria-hidden="true">·</span>Data-driven design</span>
      <span class="onepage-hero__focus-item"><span class="onepage-hero__focus-dot" aria-hidden="true">·</span>Differentiable simulation</span>
      <span class="onepage-hero__focus-item"><span class="onepage-hero__focus-dot" aria-hidden="true">·</span>Inverse problem</span>
    </p>

    <p>I am advised by <a href="https://aero-mech.tongji.edu.cn/e7/61/c23511a255841/page.htm">Prof. Tang</a> of FCM Lab and also by <a href="https://www.ruirangerfan.com/">Prof. Fan</a> of the <a href="https://mias.group/">MIAS Group</a>, both at Tongji University.</p>

    <p>I am currently seeking Ph.D. opportunities for Fall 2027 in mechanics, differentiable simulation, and AI for engineering.</p>
  </div>
</section>

<section class="onepage-section" id="news">
  <div class="onepage-section__head">
    <h2>News</h2>
  </div>

  <div class="onepage-newsbox" aria-label="News updates">
    <article class="onepage-news-entry">
      <p class="onepage-news-entry__date">2026/04/18</p>
      <p class="onepage-news-entry__body">Our Composite Structures paper, <i>Physics-constrained neural networks for high-fidelity composite failure envelopes</i>, is now online.</p>
    </article>

    <article class="onepage-news-entry">
      <p class="onepage-news-entry__date">2026/03/17</p>
      <p class="onepage-news-entry__body">Our preprint on physics-guided diffusion models for inverse design of disordered metamaterials is now available on arXiv.</p>
    </article>

    <article class="onepage-news-entry">
      <p class="onepage-news-entry__date">2026/03/08</p>
      <p class="onepage-news-entry__body">Our Thin-Walled Structures paper on autoregressive inverse design of disordered metamaterials was accepted.</p>
    </article>

    <article class="onepage-news-entry">
      <p class="onepage-news-entry__date">2026/01/28</p>
      <p class="onepage-news-entry__body">Started my internship at HKUST and began collaborating with Prof. Tianju Xue on differentiable simulation.</p>
    </article>

    <article class="onepage-news-entry">
      <p class="onepage-news-entry__date">2025/07/18</p>
      <p class="onepage-news-entry__body">Presented our work on rapid prediction and impact-parameter identification of interlaminar damage at ICDM 2025 in Singapore.</p>
    </article>
  </div>
</section>

<section class="onepage-section" id="publications">
  <div class="onepage-section__head">
    <h2>Publications</h2>
  </div>

  <div class="onepage-list">
    {% for post in publications %}
      {% assign publication_link = post.paperurl | default: post.url | relative_url %}
      {% if post.paperurl %}
        {% assign publication_link = post.paperurl %}
      {% endif %}
      <article class="onepage-item onepage-item--publication">
        <div class="onepage-item__media">
          {% if post.image %}
            <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
          {% else %}
            <div class="onepage-item__placeholder">Paper Figure</div>
          {% endif %}
        </div>
        <div class="onepage-item__content">
          <h3 class="onepage-item__title">
            <a href="{{ publication_link }}">{{ post.title }}</a>
          </h3>
          <p class="onepage-item__meta">{{ post.venue }}, {{ post.date | date: "%Y" }}</p>
          {% if post.citation %}
            <p class="onepage-item__body">{{ post.citation | replace: '&quot;', '"' | replace: 'Zhao, D.', '<strong><u>Zhao, D.</u></strong>' }}</p>
          {% elsif post.excerpt %}
            <p class="onepage-item__body">{{ post.excerpt }}</p>
          {% endif %}
          <div class="onepage-item__links">
            <a href="{{ publication_link }}">Link</a>
          </div>
        </div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="onepage-section" id="projects">
  <div class="onepage-section__head">
    <h2>Projects</h2>
  </div>

  <div class="onepage-list">
    <article class="onepage-item">
      <h3 class="onepage-item__title">
        <a href="https://github.com/FCMzp05/PhaseFieldFracture">GUI for Phase-Field Fracture Workflows</a>
      </h3>
      <p class="onepage-item__meta">Research Software</p>
      <p class="onepage-item__body">An interface-oriented research tool that streamlines phase-field fracture simulation workflows, making model setup, execution, and result inspection more accessible.</p>
      <div class="onepage-item__links">
        <a href="https://github.com/FCMzp05/PhaseFieldFracture">Repository</a>
      </div>
    </article>

    <article class="onepage-item">
      <h3 class="onepage-item__title">
        <a href="https://github.com/dazhizhao/Four-Link-Reinforcement-Learning-for-Torque-Control">Reinforcement Learning for Torque Control in a Four-Link Mechanism</a>
      </h3>
      <p class="onepage-item__meta">Mechanism Control</p>
      <p class="onepage-item__body">A control-oriented project that explores how reinforcement learning can generate effective torque strategies for a coupled four-link mechanical system.</p>
      <div class="onepage-item__links">
        <a href="https://github.com/dazhizhao/Four-Link-Reinforcement-Learning-for-Torque-Control">Repository</a>
      </div>
    </article>
  </div>
</section>
