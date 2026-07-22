# ─────────────────────────────────────────────────────────────────────────────
# SELAH — the calculator centre
#
# 🔑 THE TESTS RUN INSIDE THE BUILD.
#
# If a single Ugandan tax rule is wrong, THE IMAGE DOES NOT BUILD.
#
# That is not CI theatre. It is the whole thesis, enforced by the compiler:
# you cannot ship a wrong number, because a wrong number will not build.
#
# On the day this was written, URA's own website was serving the wrong PAYE
# bands. This Dockerfile makes that failure mode structurally impossible for us.
# ─────────────────────────────────────────────────────────────────────────────

# ══════════════════════════════════════════════════════════════════════════════
# 🔴 EVERY TEST STEP HAS A TIMEOUT. THIS IS NOT PARANOIA.
#
# The UI test suite once PASSED — 158 green assertions — and then HUNG FOREVER.
# JSDOM was constructed with `pretendToBeVisual: true`, which starts a
# requestAnimationFrame loop. The loop is a live timer. Node's event loop never
# drained, so the process never exited, so the Docker build sat on a finished
# test run until someone killed it.
#
# A build that hangs is worse than a build that fails. A failure tells you
# something. A hang tells you nothing, and it tells it to you very slowly.
#
# The real fix is in web/ui.test.js — it now calls window.close() and exits
# explicitly. `timeout` is the belt to that fix's braces: if any step ever stops
# terminating again, THE BUILD FAILS instead of waiting.
# ══════════════════════════════════════════════════════════════════════════════

# ══ STAGE 1 — VERIFY ═════════════════════════════════════════════════════════
# Execute every rule. 381 assertions. Any failure exits non-zero and KILLS THE BUILD.
# A wrong number must not be servable.
ARG RUN_TESTS=true

FROM node:22-alpine AS verify
ARG RUN_TESTS

WORKDIR /verify
COPY engine/ ./engine/

RUN if [ "$RUN_TESTS" != "true" ]; then \
      echo "" && echo "SKIPPING ENGINE TESTS (RUN_TESTS=$RUN_TESTS). This image is NOT verified; do not ship it." && echo ""; \
    else \
      echo "" && echo "=== SELAH - EXECUTING THE RULES ===" && echo "" \
      && timeout 120 node engine/engine.test.js \
      && timeout 60 node engine/calendar.test.js \
      && timeout 60 node engine/books.test.js \
      && timeout 60 node engine/accounts.test.js \
      && timeout 60 node engine/rollup.test.js \
      && timeout 60 node engine/money.test.js \
      && timeout 60 node engine/forecast.test.js \
      && timeout 60 node engine/values.test.js \
      && timeout 60 node engine/pricing.test.js \
      && timeout 60 node engine/shopping.test.js \
      && timeout 60 node engine/savings.test.js \
      && timeout 60 node engine/goals.test.js \
      && echo "" && echo "The engine computes Ugandan tax law correctly."; \
    fi

# ══ STAGE 2 — BUILD ══════════════════════════════════════════════════════════
# The browser bundle is generated from the SAME source the tests just ran against.
# One engine. One source of truth. No drift between what we test and what we ship.
FROM node:22-alpine AS build
ARG RUN_TESTS

WORKDIR /build
COPY --from=verify /verify/engine/ ./engine/
COPY build.js ./
COPY web/ ./web/

# 🔴 nginx.conf is COPIED INTO THE BUILD STAGE, and it is not a mistake.
#
# build.js reads it to enforce the CSP guard: it checks that nobody has slipped
# 'unsafe-inline' into script-src to make a stubborn button work. The guard cannot
# check a file that is not there.
#
# This line is missing from the first version and the build died with ENOENT —
# because my local simulation of the build HAD copied nginx.conf, so the
# simulation passed while the real build could not. I built a check and then
# hid its own failure from myself.
#
# A verification step you have to feed by hand is not a verification step.
COPY nginx.conf ./

# jsdom, pinned, in its own layer. An unpinned dependency in a verification step
# means the thing that guards your build can change under you without a commit.
RUN npm install --silent --no-audit --no-fund --no-save jsdom@24.1.3

RUN node build.js \
 && if [ "$RUN_TESTS" != "true" ]; then \
      echo "SKIPPING UI TESTS (RUN_TESTS=$RUN_TESTS). Bundle built, but NOT verified."; \
    else \
      echo "=== SELAH - RENDERING THE PAGE ===" \
      && timeout 180 node web/ui.test.js \
      && timeout 120 node web/individual.test.js \
      && timeout 120 node web/organisation.test.js \
      && node -e " \
           global.window = {}; \
           require('./web/assets/engine.bundle.js'); \
           const S = window.Selah; \
           if (S.paye(1000000).result !== 188250) { console.error('BUNDLE DRIFTED'); process.exit(1); } \
           if (!S.paye(1000000, 'non-resident').refused) { console.error('non-resident refusal missing'); process.exit(1); } \
           console.log('  Bundle matches the engine the tests ran against.'); \
         "; \
    fi

# 🔴 PRUNE THE BUILD SCAFFOLDING BEFORE IT REACHES THE WEB ROOT.
#
# The runtime stage copies web/ straight into /usr/share/nginx/html/. EVERYTHING
# in that directory is PUBLICLY SERVED. A test harness and an image-prep script
# are not secrets — but they are not product either, and "it's only a test file"
# is how source code ends up on the open internet.
#
# Ship what a Ugandan taxpayer needs. Nothing else.
RUN rm -f web/ui.test.js \
 && rm -f web/organisation.test.js \
 && rm -f web/individual.test.js \
 && rm -f web/assets/images/prepare.py \
 && rm -f web/assets/images/README.md \
 && rm -rf node_modules \
 && echo "" \
 && echo "  Pruned the test harness, the image script and jsdom." \
 && echo "  The web root now contains:" \
 && (cd web && find . -type f ! -name '*.jpg' ! -name '*.webp' | sort | sed 's/^/    /')


# ══ STAGE 3 — SERVE ══════════════════════════════════════════════════════════
#
# 🔴 USE THE UNPRIVILEGED IMAGE, NOT `nginx:alpine`.
#
# The stock nginx image expects a ROOT master process. Run it as USER nginx with
# a read-only filesystem and it dies on boot:
#
#     nginx: [emerg] mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)
#
# Because: (a) the stock image's own nginx.conf has a `user nginx;` directive
# that only works as root, and (b) tmpfs mounts arrive ROOT-OWNED, so uid 101
# cannot create its cache dirs inside them.
#
# nginxinc/nginx-unprivileged is built for exactly this: uid 101, port 8080,
# pid in /tmp, no `user` directive. The tmpfs mounts must ALSO be given to 101 —
# see docker-compose.yml.
#
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

LABEL org.opencontainers.image.title="Selah" \
      org.opencontainers.image.description="Uganda's tax rules, encoded correctly. Every number shows its working." \
      org.opencontainers.image.vendor="Selah Solutions Ltd" \
      org.opencontainers.image.licenses="UNLICENSED" \
      ug.selah.rules.verified="2026-07-11" \
      ug.selah.rules.tax-year="FY2026/27"

# 🔴 Uganda's tax law changes every 1 July. That label is not decoration —
#    it is how we tell, from outside a running container, whether it is stale.

USER root

# Node stays in the runtime for ONE reason: the healthcheck below.
RUN apk add --no-cache nodejs >/dev/null \
 # This entrypoint script tries to rewrite our config at boot. On a read-only
 # filesystem it fails noisily and pointlessly. We already declare IPv6.
 && rm -f /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

# ══════════════════════════════════════════════════════════════════════════════
# 🔴 ASK NGINX WHETHER IT CAN ACTUALLY START.
#
# nginx.conf once shipped TRUNCATED, cut off mid-directive at `location ~* \.(`.
# The 242 engine tests passed. The 93 UI tests passed. The bundle-drift check
# passed. The image built and pushed. And the container crash-looped on boot:
#
#     [emerg] unexpected end of file, expecting ";" or "}" in default.conf:56
#
# We verified Ugandan tax law to the shilling and never once asked the web server
# if it could come up.
#
# `nginx -t` parses the config and exits non-zero if it cannot. It costs ~50ms and
# it makes a crash-looping container UNBUILDABLE.
#
# The pattern, for whoever reads this next: EVERY ARTEFACT MUST BE VALIDATED BY
# THE THING THAT WILL CONSUME IT. Node validates the JS. jsdom validates the page.
# nginx validates the nginx config. A file nobody parses is a file nobody checked.
# ══════════════════════════════════════════════════════════════════════════════
RUN nginx -t \
 && echo "" \
 && echo "  ✓ nginx can parse its config and start." \
 && echo ""

COPY --from=build /build/web/ /usr/share/nginx/html/
COPY --from=build /build/web/assets/engine.bundle.js /opt/selah/engine.bundle.js

RUN chown -R 101:101 /usr/share/nginx/html /opt/selah

# 🔑 THE HEALTHCHECK ASKS A TAX QUESTION.
#
# "Is the port open