//
// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and Gardener contributors
//
// SPDX-License-Identifier: Apache-2.0
//

import { defineStore } from 'pinia'
import {
  ref,
  computed,
} from 'vue'

import { useApi } from '@/composables/useApi'

import { canI } from '@/utils'

import { useConfigStore } from './config'
import { useAuthnStore } from './authn'
import { useProjectStore } from './project'

export const useAuthzStore = defineStore('authz', () => {
  const api = useApi()
  const authnStore = useAuthnStore()
  const configStore = useConfigStore()
  const projectStore = useProjectStore()

  const spec = ref(null)
  const status = ref(null)

  const namespace = computed(() => {
    return spec.value?.namespace
  })

  const canCreateTerminals = computed(() => {
    return canI(status.value, 'create', 'dashboard.gardener.cloud', 'terminals')
  })

  const canCreateShoots = computed(() => {
    return canI(status.value, 'create', 'core.gardener.cloud', 'shoots')
  })

  const canPatchShoots = computed(() => {
    return canI(status.value, 'patch', 'core.gardener.cloud', 'shoots')
  })

  const canDeleteShoots = computed(() => {
    return canI(status.value, 'delete', 'core.gardener.cloud', 'shoots')
  })

  const canPatchShootsBinding = computed(() => {
    return canI(status.value, 'patch', 'core.gardener.cloud', 'shoots/binding')
  })

  const canGetSecrets = computed(() => {
    return canI(status.value, 'list', '', 'secrets')
  })

  const canCreateSecrets = computed(() => {
    return canI(status.value, 'create', '', 'secrets')
  })

  const canCreateShootsAdminkubeconfig = computed(() => {
    return canI(status.value, 'create', 'core.gardener.cloud', 'shoots/adminkubeconfig')
  })

  const canPatchSecrets = computed(() => {
    return canI(status.value, 'patch', '', 'secrets')
  })

  const canDeleteSecrets = computed(() => {
    return canI(status.value, 'delete', '', 'secrets')
  })

  const canCreateTokenRequest = computed(() => {
    return canI(status.value, 'create', '', 'serviceaccounts/token')
  })

  const canCreateServiceAccounts = computed(() => {
    return canI(status.value, 'create', '', 'serviceaccounts')
  })

  const canPatchServiceAccounts = computed(() => {
    return canI(status.value, 'patch', '', 'serviceaccounts')
  })

  const canDeleteServiceAccounts = computed(() => {
    return canI(status.value, 'delete', '', 'serviceaccounts')
  })

  const canCreateProject = computed(() => {
    return canI(status.value, 'create', 'core.gardener.cloud', 'projects')
  })

  const canPatchProject = computed(() => {
    return canI(status.value, 'patch', 'core.gardener.cloud', 'projects', projectStore.projectName)
  })

  const canManageMembers = computed(() => {
    return canI(status.value, 'manage-members', 'core.gardener.cloud', 'projects', projectStore.projectName)
  })

  const canManageServiceAccountMembers = computed(() => {
    return canPatchProject.value || canManageMembers.value
  })

  const canDeleteProject = computed(() => {
    return canI(status.value, 'delete', 'core.gardener.cloud', 'projects', projectStore.projectName)
  })

  const canGetProjectTerminalShortcuts = computed(() => {
    return canGetSecrets.value
  })

  const canUseProjectTerminalShortcuts = computed(() => {
    return configStore.isProjectTerminalShortcutsEnabled &&
      canGetProjectTerminalShortcuts.value &&
      canCreateTerminals.value
  })

  const hasGardenTerminalAccess = computed(() => {
    return configStore.isTerminalEnabled &&
    canCreateTerminals.value &&
    canPatchServiceAccounts.value &&
    canCreateServiceAccounts.value
  })

  const hasControlPlaneTerminalAccess = computed(() => {
    return configStore.isTerminalEnabled &&
      canCreateTerminals.value &&
      authnStore.isAdmin
  })

  const hasShootTerminalAccess = computed(() => {
    return configStore.isTerminalEnabled &&
      canCreateTerminals.value
  })

  async function fetchRules (namespace) {
    if (namespace && spec.value?.namespace !== namespace) {
      const body = { namespace }
      const response = await api.getSubjectRules(body)
      this.setNamespace(namespace)
      status.value = response.data
    }
  }

  function setNamespace (namespace) {
    spec.value = { namespace }
  }

  function $reset () {
    spec.value = null
    status.value = null
  }

  return {
    namespace,
    setNamespace,
    canCreateTerminals,
    canCreateShoots,
    canPatchShoots,
    canDeleteShoots,
    canPatchShootsBinding,
    canGetSecrets,
    canCreateSecrets,
    canCreateShootsAdminkubeconfig,
    canPatchSecrets,
    canDeleteSecrets,
    canCreateTokenRequest,
    canCreateServiceAccounts,
    canPatchServiceAccounts,
    canDeleteServiceAccounts,
    canCreateProject,
    canPatchProject,
    canDeleteProject,
    canManageMembers,
    canManageServiceAccountMembers,
    canGetProjectTerminalShortcuts,
    canUseProjectTerminalShortcuts,
    hasGardenTerminalAccess,
    hasControlPlaneTerminalAccess,
    hasShootTerminalAccess,
    fetchRules,
    $reset,
  }
})