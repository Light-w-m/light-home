<template>
  <div>
    <div>
      <div :style="xs||sm?{'display':'none'}:{'font-size':'4rem'}" class="leleo-left-welcome">{{ configdata.welcometitle }}</div>
    </div>

    <div>
      <v-row align="center">
        <v-col cols="12" md="8">
          <div class="search-shell" :style="xs||sm?{'display':'none'}:{}">
            <v-text-field class="v-card search-field"
              ref="searchInput"
              v-model="searchQuery"
              placeholder="搜索、输入网址，或按 Ctrl K 打开快捷面板"
              variant="outlined"
              rounded
              hide-details="true"
              @keyup.enter="performSearch"
            >
              <template v-slot:prepend-inner>
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn
                      variant="text"
                      v-bind="props"
                      class="engine-btn"
                    >
                      {{ selectedEngine.title }}
                      <v-icon icon="mdi-chevron-down"></v-icon>
                    </v-btn>
                  </template>
                  <v-list class="glass-list">
                    <v-list-item
                      v-for="engine in searchEngines"
                      :key="engine.value"
                      @click="selectedEngine = engine"
                      density="compact"
                    >
                      {{ engine.title }}
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>

              <template v-slot:append-inner>
                <v-btn
                  :icon="isUrl ? 'mdi-earth' : 'mdi-magnify'"
                  variant="text"
                  @click="performSearch"
                ></v-btn>
              </template>
            </v-text-field>
            <v-btn
              class="command-trigger"
              variant="tonal"
              prepend-icon="mdi-lightning-bolt-outline"
              @click="openCommandPalette"
            >
              Ctrl K
            </v-btn>
          </div>
          <typewriter class="ma-3 d-flex align-center justify-center" style="min-height: 200px;"></typewriter>
        </v-col>
        <v-col cols="12" md="4" align="center">
          <v-card class="ma-3 clock-card" hover>
            <template v-slot:title>
              <span class="leleo-card-title clock-font">{{formattedTime}}</span>
            </template>
            <template v-slot:subtitle>
              <span style="font-weight: bold;">{{formattedDate}}</span>
            </template>
            <turntable :color1="configdata.color.turntablecolor1" :color2="configdata.color.turntablecolor2" />
          </v-card>
        </v-col>
      </v-row>

      <div class="section-title">
        <v-chip prepend-icon="mdi-webhook" size="large" style="color: var(--leleo-vcard-color);">
          部署项目
        </v-chip>
        <v-btn
          v-if="xs||sm"
          size="small"
          variant="tonal"
          prepend-icon="mdi-lightning-bolt-outline"
          @click="openCommandPalette"
        >
          快捷面板
        </v-btn>
      </div>

      <v-container>
        <v-row>
          <v-col
            v-for="(item,key) in projectcards"
            :key="`${item.title}-${key}`"
            cols="6"
            md="4"
            lg="3"
            :style="xs?{'padding': '6px'}:{}"
          >
            <v-card class="project-card" hover>
              <div class="project-image-wrap">
                <v-img
                  aspect-ratio="1.7778"
                  :src="item.img"
                  cover
                ></v-img>
                <div class="project-image-overlay">
                  <v-chip
                    size="x-small"
                    variant="flat"
                    color="rgba(0,0,0,.52)"
                    class="project-status"
                  >
                    {{ item.status || (item.url ? 'Live' : 'Soon') }}
                  </v-chip>
                </div>
              </div>

              <v-card-title class="project-title" :style="xs?{'font-size': '0.9rem'}:{'font-size': '1.1rem'}">
                {{item.title}}
              </v-card-title>
              <v-card-subtitle class="project-subtitle" :style="xs?{'font-size': '0.6rem'}:{'font-size': '0.8rem'}">
                {{ item.subtitle }}
              </v-card-subtitle>

              <div class="project-tags" v-if="getProjectTags(item).length">
                <v-chip
                  v-for="tag in getProjectTags(item)"
                  :key="tag"
                  size="x-small"
                  variant="tonal"
                  class="project-tag"
                >
                  {{ tag }}
                </v-chip>
              </div>

              <v-card-actions :style="xs||sm||md?{'padding': '0 .35rem .35rem','min-height': '0','height':'2.5rem'}:{'padding': '0 .5rem .5rem','min-height': '0','height':'2.8rem'}">
                <v-btn
                  :disabled="!item.url"
                  :href="item.url || undefined"
                  target="_blank"
                  variant="text"
                  :prepend-icon="item.url ? 'mdi-open-in-new' : 'mdi-clock-outline'"
                >
                  {{ item.url ? '前往' : '待接入' }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  :icon="item.show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                  variant="text"
                  @click="item.show = !item.show;projectcardsShow(key);"
                ></v-btn>
              </v-card-actions>
              <v-expand-transition>
                <div v-show="item.show">
                  <v-divider></v-divider>
                  <v-card-text :style="xs?{'font-size': '0.7rem'}:{}">
                    {{item.text}}
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-dialog
      v-model="commandDialog"
      max-width="720"
      scrollable
      scrim="rgba(0,0,0,.55)"
    >
      <v-card class="command-palette" variant="tonal">
        <v-text-field
          ref="commandInput"
          v-model="commandQuery"
          autofocus
          clearable
          hide-details
          variant="solo-filled"
          prepend-inner-icon="mdi-lightning-bolt-outline"
          placeholder="搜索项目、社交链接，或直接输入关键词"
          @keyup.enter="runSelectedCommand"
          @keydown.down.prevent="moveCommand(1)"
          @keydown.up.prevent="moveCommand(-1)"
          @keydown.esc="commandDialog = false"
        ></v-text-field>

        <v-list class="command-list">
          <v-list-item
            v-for="(command,index) in filteredCommands"
            :key="`${command.type}-${command.label}-${index}`"
            :class="{ 'command-active': index === commandIndex }"
            @mouseenter="commandIndex = index"
            @click="runCommand(command)"
          >
            <template v-slot:prepend>
              <v-avatar size="34" class="command-icon" rounded="lg">
                <v-icon :icon="command.icon"></v-icon>
              </v-avatar>
            </template>
            <v-list-item-title>{{ command.label }}</v-list-item-title>
            <v-list-item-subtitle>{{ command.description }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-icon icon="mdi-keyboard-return" size="16"></v-icon>
            </template>
          </v-list-item>

          <v-list-item v-if="!filteredCommands.length" @click="searchFromCommand">
            <template v-slot:prepend>
              <v-avatar size="34" class="command-icon" rounded="lg">
                <v-icon icon="mdi-magnify"></v-icon>
              </v-avatar>
            </template>
            <v-list-item-title>搜索 “{{ commandQuery }}”</v-list-item-title>
            <v-list-item-subtitle>{{ selectedEngine.title }} 将在新标签页打开</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import typewriter from '../components/typewriter.vue';
import turntable from '../components/turntable.vue';
import { useDisplay } from 'vuetify'

export default {
    components: {
        typewriter,turntable
    },
    props: ['configdata','formattedTime','formattedDate','projectcards'],
	data() {
		return {
			searchQuery: '',
      commandDialog: false,
      commandQuery: '',
      commandIndex: 0,
			selectedEngine: { title: 'Bing', value: 'bing' },
      		searchEngines :[
				{ title: 'Bing', value: 'bing' },
				{ title: 'Google', value: 'google' },
				{ title: '百度', value: 'baidu' },
				{ title: 'Yandex', value: 'yandex' },
				{ title: 'DuckDuckGo', value: 'duckduckgo' },
			]
		}
	},
    setup() {
      const { xs,sm,md } = useDisplay();
      return {xs,sm,md};
    },
	computed: {	
		isUrl(){
			const str = this.searchQuery.trim();
  			return this.isLikelyUrl(str);
		},
    commandItems(){
      const projectCommands = (this.projectcards || []).map((item, index) => ({
        type: 'project',
        label: item.title || `项目 ${index + 1}`,
        description: item.url ? item.subtitle || '打开项目链接' : '项目入口待接入',
        icon: item.url ? 'mdi-open-in-new' : 'mdi-application-brackets-outline',
        url: item.url,
        index
      }));

      const socialCommands = (this.configdata.socialPlatformIcons || []).map((item, index) => ({
        type: 'social',
        label: this.getSocialLabel(item, index),
        description: item.link || '打开社交链接',
        icon: item.icon || 'mdi-link-variant',
        url: this.normalizeSocialLink(item.link)
      }));

      const actionCommands = [
        {
          type: 'action',
          label: '聚焦搜索框',
          description: '回到主页搜索或输入网址',
          icon: 'mdi-magnify',
          action: () => this.focusSearch()
        },
        {
          type: 'action',
          label: `使用 ${this.selectedEngine.title} 搜索`,
          description: this.commandQuery ? `搜索 “${this.commandQuery}”` : '输入关键词后回车搜索',
          icon: 'mdi-search-web',
          action: () => this.searchFromCommand()
        }
      ];

      return [...actionCommands, ...projectCommands, ...socialCommands];
    },
    filteredCommands(){
      const keyword = (this.commandQuery || '').trim().toLowerCase();
      if(!keyword){
        return this.commandItems.slice(0, 8);
      }

      const result = this.commandItems.filter(item => {
        return `${item.label} ${item.description}`.toLowerCase().includes(keyword);
      });

      if(result.length){
        return result.slice(0, 10);
      }

      return [];
    }
	},
  mounted() {
    window.addEventListener('keydown', this.handleShortcut);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleShortcut);
  },
  watch: {
    commandDialog(val){
      if(val){
        this.commandIndex = 0;
        this.$nextTick(() => {
          this.$refs.commandInput?.focus?.();
        });
      }
    },
    commandQuery(){
      this.commandIndex = 0;
    }
  },
    methods:{
      projectcardsShow(key){
        for(let i = 0;i < this.projectcards.length;i++){
          if(i != key){
            this.projectcards[i].show = false;
          }
        }
      },
	  performSearch() {
		const query = this.searchQuery.trim();
		if (!query) return;

		if (this.isUrl) {
			let url = query;
			// 自动补全协议（如果缺少）
			if (!/^[a-z]+:\/\//i.test(url)) {
				url = 'http://' + url; // 默认用http
			}
			
			window.open(url, '_blank');
		} else {
			const engineUrls = {
				google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
				bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
				baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
				yandex: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
				duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
			};
			window.open(engineUrls[this.selectedEngine.value], '_blank');
		}
	  },
    openCommandPalette(){
      this.commandQuery = '';
      this.commandDialog = true;
    },
    handleShortcut(event){
      const target = event.target;
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable;
      if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'){
        event.preventDefault();
        this.openCommandPalette();
        return;
      }
      if(event.key === '/' && !isTyping && !(this.xs || this.sm)){
        event.preventDefault();
        this.focusSearch();
      }
    },
    focusSearch(){
      this.commandDialog = false;
      this.$nextTick(() => {
        this.$refs.searchInput?.focus?.();
      });
    },
    runSelectedCommand(){
      const command = this.filteredCommands[this.commandIndex];
      if(command){
        this.runCommand(command);
      }else{
        this.searchFromCommand();
      }
    },
    runCommand(command){
      if(command.action){
        command.action();
        return;
      }
      if(command.url){
        window.open(command.url, '_blank');
        this.commandDialog = false;
        return;
      }
      if(command.type === 'project' && typeof command.index === 'number'){
        this.projectcards[command.index].show = true;
        this.projectcardsShow(command.index);
        this.commandDialog = false;
      }
    },
    moveCommand(direction){
      const length = this.filteredCommands.length;
      if(!length) return;
      this.commandIndex = (this.commandIndex + direction + length) % length;
    },
    searchFromCommand(){
      const query = (this.commandQuery || this.searchQuery || '').trim();
      if(!query) return;
      this.searchQuery = query;
      this.commandDialog = false;
      this.$nextTick(() => this.performSearch());
    },
    getProjectTags(item){
      if(Array.isArray(item.tags)){
        return item.tags.slice(0, 3);
      }
      if(Array.isArray(item.stack)){
        return item.stack.slice(0, 3);
      }
      if(item.url){
        return ['Online'];
      }
      return ['待接入'];
    },
    getSocialLabel(item, index){
      const iconMap = {
        'mdi-github': 'GitHub',
        'mdi-email': 'Email',
        'mdi-qqchat': 'QQ',
        'mdi-wechat': 'WeChat',
        'mdi-youtube': 'YouTube',
        'mdi-facebook': 'Facebook'
      };
      return item.title || item.name || iconMap[item.icon] || `社交链接 ${index + 1}`;
    },
    normalizeSocialLink(link){
      if(!link) return '';
      if(link.includes('@') && !/^[a-z]+:/i.test(link)){
        return `mailto:${link}`;
      }
      return link;
    },
	  isLikelyUrl(input) {
		// 移除首尾空格
		const str = input.trim();
		
		// 情况1：明确包含协议头（http/https/ftp等）
		if (/^(https?|ftp):\/\//i.test(str)) return true;
		
		// 情况2：符合域名格式（支持国际化域名）
		const domainPattern = /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i;
		
		// 情况3：localhost或IP地址
		const localPattern = /^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i;
		
		
		return (
			domainPattern.test(str) || 
			localPattern.test(str)
		);
		}
    }
};
</script>

<style scoped>
@import url(/css/app.less);
@import url(/css/mobile.less);
.search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-field {
  flex: 1;
}

.command-trigger {
  height: 48px;
  color: var(--leleo-vcard-color);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 0;
}

.clock-card {
  overflow: hidden;
}

.project-card {
  height: 100%;
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease;
}

.project-card:hover {
  transform: translateY(-4px);
}

.project-image-wrap {
  position: relative;
  overflow: hidden;
}

.project-image-wrap :deep(.v-img) {
  opacity: .84;
  transition: transform .35s ease, opacity .35s ease;
}

.project-card:hover .project-image-wrap :deep(.v-img) {
  opacity: 1;
  transform: scale(1.04);
}

.project-image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 8px;
  background: linear-gradient(180deg, rgba(0,0,0,.28), transparent 54%);
  pointer-events: none;
}

.project-status {
  color: #fff;
}

.project-title {
  padding: .45rem .75rem .05rem;
  line-height: 1.25;
}

.project-subtitle {
  padding: .05rem .75rem .2rem;
}

.project-tags {
  display: flex;
  gap: 4px;
  padding: 0 .7rem .35rem;
  overflow: hidden;
}

.project-tag {
  max-width: 74px;
}

.command-palette {
  padding: 10px;
  color: var(--leleo-vcard-color);
  backdrop-filter: blur(calc(var(--leleo-blur) + 8px));
}

.command-list {
  margin-top: 8px;
  max-height: 420px;
  overflow-y: auto;
  background: transparent;
}

.command-icon {
  background: rgba(255, 255, 255, .14);
  color: var(--leleo-vcard-color);
}

.command-active {
  background: rgba(255,255,255,.14);
  border-radius: 8px;
}

.glass-list {
	background: transparent !important;
	backdrop-filter: blur(var(--leleo-blur));
	border-radius: 5%;
	color: var(--leleo-vcard-color);
	overflow: hidden;
}

@media (max-width: 960px){
  .section-title {
    padding: 8px 8px 0;
  }

  .project-title {
    padding: .25rem .5rem 0;
  }

  .project-subtitle {
    padding: 0 .5rem .15rem;
  }

  .project-tags {
    padding: 0 .45rem .25rem;
  }

  .command-list {
    max-height: 360px;
  }
}
</style>
