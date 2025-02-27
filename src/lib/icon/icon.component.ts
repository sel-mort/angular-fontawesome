import { Component, HostBinding, Input, OnChanges, Optional, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  FaSymbol,
  FlipProp,
  icon,
  IconDefinition,
  IconParams,
  IconProp,
  parse,
  PullProp,
  RotateProp,
  SizeProp,
  Styles,
  Transform,
} from '@fortawesome/fontawesome-svg-core';
import { FaConfig } from '../config';
import { FaIconLibrary } from '../icon-library';
import { faWarnIfIconDefinitionMissing } from '../shared/errors/warn-if-icon-html-missing';
import { faWarnIfIconSpecMissing } from '../shared/errors/warn-if-icon-spec-missing';
import { AnimationProp, FaProps } from '../shared/models/props.model';
import { faClassList } from '../shared/utils/classlist.util';
import { faNormalizeIconSpec } from '../shared/utils/normalize-icon-spec.util';
import { FaStackItemSizeDirective } from '../stack/stack-item-size.directive';
import { FaStackComponent } from '../stack/stack.component';

@Component({
  selector: 'fa-icon',
  template: ``,
  host: {
    class: 'ng-fa-icon',
    '[attr.title]': 'title',
  },
})
export class FaIconComponent implements OnChanges {
  @Input() icon: IconProp;

  /**
   * Specify a title for the icon.
   *
   * This text will be displayed in a tooltip on hover and presented to the
   * screen readers.
   */
  @Input() title?: string;

  /**
   * Icon animation.
   *
   * Most of the animations are only available when using Font Awesome 6. With
   * Font Awesome 5, only 'spin' and 'spin-pulse' are supported.
   */
  @Input() animation?: AnimationProp;

  /**
   * @deprecated Use animation="spin" instead. To be removed in 0.14.0.
   */
  @Input() set spin(value: boolean) {
    this.animation = value ? 'spin' : undefined;
  }

  /**
   * @deprecated Use animation="spin-pulse" instead. To be removed in 0.14.0.
   */
  @Input() set pulse(value: boolean) {
    this.animation = value ? 'spin-pulse' : undefined;
  }

  @Input() mask?: IconProp;

  /**
   * Set `style` attribute on the SVG element rendered by the component.
   *
   * @deprecated This input breaks view encapsulation and is not recommended.
   * For simple cases (like colors), use `style` on the component itself, for
   * more complex usages, explicitly opt-in to break the view encapsulation.
   * This input is deprecated since 0.12.0 and will be removed in 0.13.0.
   */
  @Input() styles?: Styles;
  @Input() flip?: FlipProp;
  @Input() size?: SizeProp;
  @Input() pull?: PullProp;
  @Input() border?: boolean;
  @Input() inverse?: boolean;
  @Input() symbol?: FaSymbol;
  @Input() rotate?: RotateProp;
  @Input() fixedWidth?: boolean;

  /**
   * Set `class` attribute on the SVG element rendered by the component.
   *
   * @deprecated This input breaks view encapsulation and is not recommended.
   * For simple cases (like colors), use `class` on the component itself, for
   * more complex usages, explicitly opt-in to break the view encapsulation.
   * This input is deprecated since 0.12.0 and will be removed in 0.13.0.
   */
  @Input() classes?: string[] = [];
  @Input() transform?: string | Transform;

  /**
   * Specify the `role` attribute for the rendered <svg> element.
   *
   * @default 'img'
   */
  @Input() a11yRole: string;

  @HostBinding('innerHTML') renderedIconHTML: SafeHtml;

  constructor(
    private sanitizer: DomSanitizer,
    private config: FaConfig,
    private iconLibrary: FaIconLibrary,
    @Optional() private stackItem: FaStackItemSizeDirective,
    @Optional() stack: FaStackComponent,
  ) {
    if (stack != null && stackItem == null) {
      console.error(
        'FontAwesome: fa-icon and fa-duotone-icon elements must specify stackItemSize attribute when wrapped into ' +
          'fa-stack. Example: <fa-icon stackItemSize="2x"></fa-icon>.',
      );
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.icon == null && this.config.fallbackIcon == null) {
      faWarnIfIconSpecMissing();
      return;
    }

    if (changes) {
      const iconToBeRendered = this.icon != null ? this.icon : this.config.fallbackIcon;
      const iconDefinition = this.findIconDefinition(iconToBeRendered);
      if (iconDefinition != null) {
        const params = this.buildParams();
        this.renderIcon(iconDefinition, params);
      }
    }
  }

  /**
   * Programmatically trigger rendering of the icon.
   *
   * This method is useful, when creating {@link FaIconComponent} dynamically or
   * changing its inputs programmatically as in these cases icon won't be
   * re-rendered automatically.
   */
  render() {
    this.ngOnChanges({});
  }

  protected findIconDefinition(i: IconProp | IconDefinition): IconDefinition | null {
    const lookup = faNormalizeIconSpec(i, this.config.defaultPrefix);
    if ('icon' in lookup) {
      return lookup;
    }

    const definition = this.iconLibrary.getIconDefinition(lookup.prefix, lookup.iconName);
    if (definition != null) {
      return definition;
    }

    faWarnIfIconDefinitionMissing(lookup);
    return null;
  }

  protected buildParams() {
    const classOpts: FaProps = {
      flip: this.flip,
      animation: this.animation,
      border: this.border,
      inverse: this.inverse,
      size: this.size || null,
      pull: this.pull || null,
      rotate: this.rotate || null,
      fixedWidth: typeof this.fixedWidth === 'boolean' ? this.fixedWidth : this.config.fixedWidth,
      stackItemSize: this.stackItem != null ? this.stackItem.stackItemSize : null,
    };

    const parsedTransform = typeof this.transform === 'string' ? parse.transform(this.transform) : this.transform;

    return {
      title: this.title,
      transform: parsedTransform,
      classes: [...faClassList(classOpts), ...this.classes],
      mask: this.mask != null ? this.findIconDefinition(this.mask) : null,
      styles: this.styles != null ? this.styles : {},
      symbol: this.symbol,
      attributes: {
        role: this.a11yRole,
      },
    };
  }

  private renderIcon(definition: IconDefinition, params: IconParams) {
    const renderedIcon = icon(definition, params);
    this.renderedIconHTML = this.sanitizer.bypassSecurityTrustHtml(renderedIcon.html.join('\n'));
  }
}
