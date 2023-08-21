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

import {
  map,
  flatMap,
  filter,
  get,
  some,
  find,
  sortBy,
} from '@/lodash'

export const useGardenerExtensionStore = defineStore('gardenerExtension', () => {
  const api = useApi()

  const list = ref(null)

  const isInitial = computed(() => {
    return list.value === null
  })

  const gardenerExtensionList = computed(() => {
    return list.value
  })

  async function fetchGardenerExtensions () {
    const response = await api.getGardenerExtensions()
    list.value = response.data
  }

  const sortedDnsProviderList = computed(() => {
    const supportedProviderTypes = ['aws-route53', 'azure-dns', 'azure-private-dns', 'google-clouddns', 'openstack-designate', 'alicloud-dns', 'infoblox-dns', 'netlify-dns']
    const resources = flatMap(list.value, 'resources')
    const dnsProvidersFromDnsRecords = filter(resources, ['kind', 'DNSRecord'])

    const dnsProviderList = map(supportedProviderTypes, type => {
      return {
        type,
        primary: get(find(dnsProvidersFromDnsRecords, { type }), 'primary', false),
      }
    })

    const dnsServiceExtensionDeployed = some(list.value, ['name', 'extension-shoot-dns-service'])
    if (dnsServiceExtensionDeployed) {
      return dnsProviderList
    }
    // return only primary DNS Providers backed by DNSRecord
    return filter(dnsProviderList, 'primary')
  })

  const networkingTypes = computed(() => {
    const resources = flatMap(list.value, 'resources')
    const networkingResources = filter(resources, ['kind', 'Network'])
    return map(networkingResources, 'type')
  })

  const networkingTypeList = computed(() => {
    return sortBy(networkingTypes.value)
  })

  return {
    list,
    isInitial,
    gardenerExtensionList,
    fetchGardenerExtensions,
    sortedDnsProviderList,
    networkingTypes,
    networkingTypeList,
  }
})
