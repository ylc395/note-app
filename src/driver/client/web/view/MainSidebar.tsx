import { Tabs } from '@ark-ui/solid';
import {
  BookTextIcon,
  ChartColumnIcon,
  LightbulbIcon,
  HashIcon,
  SearchIcon,
  StarIcon,
  SettingsIcon,
  Trash2Icon,
} from 'lucide-solid';
import { SidebarTabs } from './UIState';

export default function Sidebar() {
  const menuClassName = 'space-y-stack-s';
  const iconClassName = 'w-6 h-6 stroke-[1.5]';
  const buttonClassName =
    'relative p-inset-square-md flex justify-center items-center cursor-pointer rounded-lg text-brand-primary opacity-40 data-[selected]:opacity-100';

  return (
    <div class="flex flex-col h-screen bg-surface-secondary relative overflow-auto flex-shrink-0 border-r-border-secondary border-r py-inset-square-md">
      <Tabs.List
        asChild={(childProps) => (
          <ul {...childProps()} class={menuClassName}>
            <Tabs.Trigger
              value={SidebarTabs.Memo}
              asChild={(props) => (
                <li>
                  <a {...props()} class={buttonClassName}>
                    <LightbulbIcon class={iconClassName} />
                  </a>
                </li>
              )}
            />
            <Tabs.Trigger
              value={SidebarTabs.Note}
              asChild={(props) => (
                <li>
                  <a {...props()} class={buttonClassName}>
                    <BookTextIcon class={iconClassName} />
                  </a>
                </li>
              )}
            />
          </ul>
        )}
      />
      <ul class={`${menuClassName} mt-stack-md pt-stack-md border-t border-t-border-secondary`}>
        <li>
          <a class={buttonClassName}>
            <StarIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName}>
            <HashIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName}>
            <SearchIcon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName}>
            <ChartColumnIcon class={iconClassName} />
          </a>
        </li>
      </ul>
      <ul class={`mt-auto ${menuClassName}`}>
        <li>
          <a class={buttonClassName}>
            <Trash2Icon class={iconClassName} />
          </a>
        </li>
        <li>
          <a class={buttonClassName}>
            <SettingsIcon class={iconClassName} />
          </a>
        </li>
      </ul>
    </div>
  );
}
