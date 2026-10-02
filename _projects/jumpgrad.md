---
layout: page
title: "JumpGrad: Differentiable Optimization through Stochastic Mechanics"
description: An end-to-end control framework for stochastic stick-slip mechanics, connecting a learned controller with physical simulation and custom gradients while retaining hard discrete switching events.
event: Tesseract Hackathon 2026 · Track 03 — Hybrid ML + Mechanistic Models
category: Research Software
importance: 0
github: https://github.com/dazhizhao/stochastic-stick-slip-tesseract
external_url: https://github.com/dazhizhao/stochastic-stick-slip-tesseract
permalink: /projects/jumpgrad/
---

**Tesseract Hackathon 2026 · Track 03 — Hybrid ML + Mechanistic Models**

JumpGrad connects a learned controller to a mechanical simulator to optimize vibration control under stochastic switching. The physical simulation retains hard LOW/HIGH actuator events. A custom gradient based on finite differences with shared random samples connects the mechanics to the controller for end-to-end optimization.

{% include figure.liquid path="/assets/img/projects/jumpgrad-pipeline.png" class="img-fluid" alt="JumpGrad controller connected to stochastic mechanics, with forward outputs and backward gradients" %}

[Repository](https://github.com/dazhizhao/stochastic-stick-slip-tesseract) · [Tesseract Hackathon 2026](https://pasteurlabs.ai/tesseract-hackathon-2026/)

The diagram is reproduced from the [JumpGrad repository](https://github.com/dazhizhao/stochastic-stick-slip-tesseract/blob/f04d3c37156d871dc18d5d149c7584c25f162de8/outputs/jumpgrad_visuals/tesseract_pipeline.png), licensed under [Apache 2.0](https://github.com/dazhizhao/stochastic-stick-slip-tesseract/blob/main/LICENSE).
