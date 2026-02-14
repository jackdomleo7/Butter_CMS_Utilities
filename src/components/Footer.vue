<template>
  <footer class="footer">
    <p>
      Created by
      <a class="footer-link" href="https://jackdomleo.dev" target="_blank" rel="noopener noreferrer"
        >Jack Domleo</a
      >
    </p>
    <p class="footer__secondary">
      Not affiliated with Butter CMS •
      <button class="footer-link" @click="showPrivacyModal = true">Privacy Policy</button>
    </p>

    <Modal
      id="privacyModal"
      class="privacy-policy-modal"
      :open="showPrivacyModal"
      @close="showPrivacyModal = false"
    >
      <template #heading>Privacy Policy</template>
      <p><strong>Last updated: February 2026</strong></p>

      <h3>Data Collection</h3>
      <p>
        We do not collect, store on servers, or transmit any data to third parties. This includes:
      </p>
      <ul>
        <li>No personal information transmitted to our servers</li>
        <li>No usage analytics or tracking</li>
        <li>No server-side logging</li>
        <li>No data shared with third-party services</li>
      </ul>

      <h3>Local Storage</h3>
      <p>
        We store your Butter CMS API token and other settings locally in your browser's localStorage
        to improve your experience. This is completely safe because:
      </p>
      <ul>
        <li>Data is stored only on your device, never on our servers</li>
        <li>Only your browser can access localStorage from this domain</li>
        <li>Other websites cannot access your stored token</li>
        <li>Clearing your browser data will remove the stored token</li>
        <li>You can delete your stored token anytime by clearing the input and refreshing</li>
      </ul>

      <h3>How It Works</h3>
      <p>
        All utilities on this page run entirely in your browser (client-side). When you provide your
        Butter CMS API token, it is used only to make direct API calls from your browser to Butter
        CMS's official API endpoints. Your token never passes through our servers because we don't
        have any servers.
      </p>
      <p>
        <strong>Token Type:</strong> We only require a read-only API token. This application only
        reads data from your Butter CMS account and never attempts to write or modify any content.
      </p>

      <h3>Third-Party Services</h3>
      <p>
        The only external service this page interacts with is the official Butter CMS API
        (api.buttercms.com), and only when you explicitly use one of the utilities with your own API
        token.
      </p>

      <h3>GitHub Pages Hosting</h3>
      <p>
        This site is hosted on GitHub Pages. GitHub may collect visitor information as part of their
        standard hosting service. Please refer to
        <a
          href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub's Privacy Statement</a
        >
        for more information.
      </p>

      <h3>Your Responsibility</h3>
      <p>
        You are responsible for keeping your Butter CMS API token secure. Do not share your token
        with others or use it on untrusted devices. Additionally, please ensure you only provide a
        read-only API token to this application. While this application never attempts to write or
        modify data, providing a write-enabled token would be unnecessary and poses a potential
        security risk.
      </p>

      <h3>Questions</h3>
      <p>
        If you have questions about this privacy policy, please contact
        <a href="https://jackdomleo.dev" target="_blank" rel="noopener noreferrer">Jack Domleo</a>.
      </p>
    </Modal>
  </footer>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'

const Modal = defineAsyncComponent(() => import('./Modal.vue'))

const showPrivacyModal = ref<boolean>(false)
</script>

<style lang="scss">
.footer {
  background-color: var(--gray-800);
  color: var(--text-inverted);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  margin-top: auto;

  p {
    font-size: var(--font-size-sm);
    margin: 0;
  }

  &__secondary {
    margin-top: var(--space-3);
    color: var(--gray-300);
  }

  &-link {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    color: var(--text-inverted);
    text-decoration: none;
    font-weight: 700;

    &:hover {
      text-decoration: underline;
      color: var(--text-inverted);
    }

    &:focus-visible {
      outline-color: var(--text-inverted);
    }
  }
}

.privacy-policy-modal {
  font-size: var(--font-size-sm);

  h3 {
    font-size: var(--font-size-lg);
    color: var(--text-primary);
    margin-top: var(--space-6);
    margin-bottom: var(--space-3);
    font-weight: 600;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    color: var(--text-secondary);
    margin: 0 0 var(--space-4) 0;
    line-height: var(--line-height-relaxed);
  }

  ul {
    padding-left: var(--space-6);
    margin-bottom: var(--space-4);
    color: var(--text-secondary);

    li {
      margin-bottom: var(--space-2);
      line-height: var(--line-height-relaxed);
    }
  }

  strong {
    color: var(--text-primary);
  }
}
</style>
