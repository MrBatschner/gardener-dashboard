//
// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and Gardener contributors
//
// SPDX-License-Identifier: Apache-2.0
//

import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { useLocalStorage } from '@vueuse/core'

import { useAppStore } from '@/store/app'
import { useAuthnStore } from '@/store/authn'
import { useLoginStore } from '@/store/login'

import GLogin from '@/layouts/GLogin.vue'

const { createPlugins } = global.fixtures.helper

describe('components', () => {
  describe('g-login', () => {
    let pinia
    let appStore
    let authnStore
    let loginStore // eslint-disable-line no-unused-vars
    let mockRoute
    let mockRouter
    let mockNext
    let autoLogin

    function mountLogin () {
      return mount(GLogin, {
        global: {
          plugins: [
            ...createPlugins(),
            pinia,
          ],
          mocks: {
            $route: mockRoute,
            $router: mockRouter,
          },
        },
      })
    }

    beforeEach(() => {
      fetch.mockResponse(JSON.stringify({
        loginTypes: ['oidc', 'token'],
        landingPageUrl: 'https://gardener.cloud/',
      }))
      autoLogin = useLocalStorage('global/auto-login', 'disabled')
      mockRoute = {
        query: {
          redirectPath: '/namespace/garden/shoots',
        },
      }
      mockRouter = {
        push: vi.fn(),
        replace: vi.fn(),
      }
      pinia = createTestingPinia({
        initialState: {
          authn: {
            user: {
              email: 'john.doe@example.org',
              isAdmin: true,
            },
          },
        },
      })
      setActivePinia(pinia)
      appStore = useAppStore()
      authnStore = useAuthnStore()
      loginStore = useLoginStore()
    })

    it('should render the login page', () => {
      const wrapper = mountLogin()
      expect(wrapper.find('div.title-text').text()).toBe('Universal Kubernetes at Scale')
    })

    describe('#beforeRouteEnter', () => {
      let error

      beforeEach(() => {
        error = Object.assign(new Error('error'), {
          title: 'title',
        })
      })

      it('should show a login error', async () => {
        const wrapper = mountLogin()
        const to = {
          hash: '#' + new URLSearchParams({
            error: error.message,
            title: error.title,
          }),
        }
        mockNext = vi.fn().mockImplementation(fn => {
          if (typeof fn === 'function') {
            fn(wrapper.vm)
          }
        })
        await GLogin.beforeRouteEnter.call(wrapper.vm, to, undefined, mockNext)
        expect(mockNext).toBeCalledTimes(1)
        expect(mockNext.mock.calls[0]).toEqual([expect.any(Function)])
        expect(appStore.setError).toBeCalledTimes(1)
        expect(appStore.setError.mock.calls[0]).toEqual([error])
        expect(mockRouter.replace).toBeCalledTimes(1)
        expect(mockRouter.replace.mock.calls[0]).toEqual(['/login'])
      })

      it('should not show a login error', async () => {
        error.message = 'NoAutoLogin'
        const wrapper = mountLogin()
        const to = {
          hash: '#' + new URLSearchParams({
            error: error.message,
            title: error.title,
          }),
        }
        mockNext = vi.fn().mockImplementation(fn => {
          if (typeof fn === 'function') {
            fn(wrapper.vm)
          }
        })
        await GLogin.beforeRouteEnter.call(wrapper.vm, to, undefined, mockNext)
        expect(mockNext).toBeCalledTimes(1)
        expect(mockNext.mock.calls[0]).toEqual([expect.any(Function)])
        expect(appStore.setError).not.toBeCalled()
        expect(mockRouter.replace).toBeCalledTimes(1)
        expect(mockRouter.replace.mock.calls[0]).toEqual(['/login'])
      })

      it('should automatically login', async () => {
        autoLogin.value = 'enabled'
        const wrapper = mountLogin()
        const to = {
          query: {
            redirectPath: '/namespace/garden-foo/shoots',
          },
        }
        mockNext = vi.fn()
        await GLogin.beforeRouteEnter.call(wrapper.vm, to, undefined, mockNext)
        expect(mockNext).toBeCalledTimes(1)
        expect(mockNext.mock.calls[0]).toEqual([false])
        expect(authnStore.signinWithOidc).toBeCalledTimes(1)
        expect(authnStore.signinWithOidc.mock.calls[0]).toEqual([to.query.redirectPath])
      })
    })
  })
})
